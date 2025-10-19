  // ==============================================
  // APPROVE NEW STARTER COMPLIANCE (Liz Only)
  // ==============================================
  static async approveCompliance(request, reply) {
    try {
      console.log('\n === APPROVE NEW STARTER COMPLIANCE ===');

      const { pin, approvedBy = 'liz', notes, workspaceAccess = [] } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      // Get new starter
      const starterQuery = 'SELECT * FROM new_starters WHERE pin = $1';
      const starterResult = await executeQuery(starterQuery, [pin]);

      if (starterResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'New starter not found'
        });
      }

      const newStarter = starterResult.rows[0];

      // Transaction: Update new_starter + Update compliance
      const queries = [
        // 1. Update new_starters table
        {
          query: `
            UPDATE new_starters
            SET
              compliance_approved = true,
              compliance_approved_at = NOW(),
              status = 'active',
              workspace_access = $1,
              updated_at = NOW()
            WHERE pin = $2
            RETURNING *
          `,
          params: [JSON.stringify(workspaceAccess), pin]
        },

        // 2. Update compliance table
        {
          query: `
            UPDATE compliance
            SET
              compliance_status = 'approved',
              approved_at = NOW(),
              reviewed_at = NOW(),
              reviewed_by = $1,
              notes = $2,
              updated_at = NOW()
            WHERE person_id = $3 AND person_type = 'new_starter'
            RETURNING *
          `,
          params: [approvedBy, notes, newStarter.id]
        }
      ];

      await executeTransaction(queries);

      console.log(` Compliance approved for ${newStarter.full_name}`);

      // ==============================================
      // SYNC TO CASE MANAGERS DATABASE
      // ==============================================
      try {
        console.log('\n === SYNCING TO CASE MANAGERS DATABASE ===');

        // 1. Insert into case_managers table
        const caseManagerQuery = `
          INSERT INTO case_managers (
            pin, name, email, password_hash, status, compliance_approved, approved_at
          ) VALUES (
            $1, $2, $3, $4, 'active', true, NOW()
          )
          ON CONFLICT (pin) DO UPDATE
          SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            status = 'active',
            compliance_approved = true,
            approved_at = NOW(),
            updated_at = NOW()
        `;

        await executeQueryOnCaseManagers(caseManagerQuery, [
          newStarter.pin,
          newStarter.full_name,
          newStarter.email,
          newStarter.password_hash
        ]);

        console.log(` Case manager record created/updated for ${newStarter.full_name}`);

        // 2. Insert full access rules for all features
        const featuresForFullAccess = [
          'create_case',
          'edit_case',
          'view_cases',
          'view_reports',
          'generate_reports',
          'assign_readers',
          'view_finances',
          'access_settings'
        ];

        console.log(` Creating workspace access rules for ${featuresForFullAccess.length} features...`);

        for (const feature of featuresForFullAccess) {
          const accessRuleQuery = `
            INSERT INTO workspace_access_rules (
              case_manager_pin, feature, access_level, enabled
            ) VALUES (
              $1, $2, 'full', true
            )
            ON CONFLICT (case_manager_pin, feature) DO UPDATE
            SET
              access_level = 'full',
              enabled = true,
              updated_at = NOW()
          `;

          await executeQueryOnCaseManagers(accessRuleQuery, [
            newStarter.pin,
            feature
          ]);
        }

        console.log(` Workspace access rules created successfully`);

        // 3. Emit compliance_approved notification to new starter
        notificationService.sendNotification({
          type: 'compliance_approved',
          message: 'Your compliance has been approved! You now have full workspace access.',
          data: {
            pin: newStarter.pin,
            name: newStarter.full_name,
            accessLevel: 'full'
          },
          timestamp: new Date().toISOString()
        });

        console.log(` Compliance approved notification sent to ${newStarter.full_name}`);

      } catch (syncError) {
        console.error('❌ Error syncing to Case Managers database:', syncError);
        console.error('   Details:', syncError.message);
        console.error('   Stack:', syncError.stack);
        // Don't fail the entire approval - just log the error
        // The HR Compliance side still succeeded
      }

      // Emit WebSocket notification (for HR team)
      notificationService.sendNotification({
        type: 'new_starter_approved',
        message: `${newStarter.full_name} compliance approved by ${approvedBy}`,
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          workspaceAccess
        },
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        message: 'Compliance approved successfully',
        data: {
          pin: newStarter.pin,
          name: newStarter.full_name,
          status: 'active',
          approvedBy,
          approvedAt: new Date().toISOString(),
          workspaceAccess
        }
      });

    } catch (error) {
      console.error('❌ Error approving compliance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to approve compliance',
        details: error.message
      });
    }
  }
