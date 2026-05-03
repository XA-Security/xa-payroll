import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { fetchAndStoreMicrosoftAvatar } from '@/lib/microsoft-avatar'

// Enhanced server-side logger for Microsoft SSO debugging
const serverLog = (prefix: string, message: string, data?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  console.log(`[${timestamp}] ${prefix} ${message}${dataStr}`)
}

const serverError = (prefix: string, message: string, error?: unknown) => {
  const timestamp = new Date().toISOString()
  const errorStr = error instanceof Error ? error.message : String(error)
  console.error(`[${timestamp}] ${prefix} ${message}: ${errorStr}`)
}

// Enhanced error logging with full context for debugging
const serverErrorWithContext = (prefix: string, message: string, error?: unknown, context?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString()
  const errorStr = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : ''
  const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
  const stackStr = errorStack ? ` | Stack: ${errorStack}` : ''
  console.error(`[${timestamp}] ${prefix} ${message}: ${errorStr}${contextStr}${stackStr}`)
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  serverLog('[Auth:Callback]', 'Starting OAuth callback handler', {
    origin,
    hasCode: !!code,
    redirectPath: next,
    userAgent: request.headers.get('user-agent') || 'N/A',
    method: request.method,
  })

  // Log all query parameters for debugging
  const allSearchParams = Object.fromEntries(searchParams)
  serverLog('[Auth:Callback]', 'OAuth callback query parameters', {
    paramKeys: Object.keys(allSearchParams),
    paramsCount: Object.keys(allSearchParams).length,
  })

  // PKCE flow always includes a code — proceeding directly to code exchange
  const supabase = await createClient()

  // Log cookies for PKCE debugging
  const allCookies = request.cookies.getAll()
  serverLog('[Auth:Callback]', 'Cookies received in callback', {
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
  })

  // Detailed PKCE cookie debugging
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'))
  serverLog('[Auth:Callback]', 'Supabase-related cookies detailed', {
    supabaseCookieCount: supabaseCookies.length,
    supabaseCookies: supabaseCookies.map(c => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      valuePrefix: c.value?.substring(0, 30) || 'N/A',
    })),
    hasAuthToken: allCookies.some(c => c.name.includes('auth-token')),
    hasPkceVerifier: allCookies.some(c => c.name.includes('code-verifier')),
  })

  if (code) {
    try {
      const codeExchangeStart = Date.now()
      serverLog('[Auth:Callback]', 'Exchanging authorization code for session', {
        codeLength: code?.length || 0,
        codePrefix: code?.substring(0, 10) || '',
      })

      // Create server client with cookie access for PKCE flow
      // The middleware will have set the PKCE code verifier in cookies
      const supabase = await createClient()

      // Exchange the code for a session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        const errorObj = sessionError as unknown as Record<string, unknown>
        serverErrorWithContext('[Auth:Callback]', 'Session exchange failed', sessionError, {
          code: code?.substring(0, 10),
          errorCode: errorObj?.code,
          errorStatus: errorObj?.status,
        })
        throw sessionError
      }

      const codeExchangeDuration = Date.now() - codeExchangeStart
      serverLog('[Auth:Callback]', 'Session exchanged successfully', {
        duration: codeExchangeDuration,
        hasSession: !!sessionData?.user,
        sessionHasAccessToken: !!sessionData?.session?.access_token,
        sessionHasRefreshToken: !!sessionData?.session?.refresh_token,
      })

      if (sessionData?.user) {
        const user = sessionData.user
        const provider = user.app_metadata?.provider

        serverLog('[Auth:Callback]', 'User authenticated from provider', {
          provider,
          userId: user.id,
          userIdLength: user.id?.length || 0,
          email: user.email,
          providerKeys: user.app_metadata ? Object.keys(user.app_metadata) : [],
        })

        // Handle magic link (email OTP) separately
        if (provider === 'email') {
          serverLog('[Auth:Callback]', 'Processing magic link authentication', {
            email: user.email,
          })

          // Validate email domain
          const domain = user.email?.toLowerCase() || '';
          const isValidDomain = domain.endsWith('@xasecurity.ca') || domain.endsWith('@intuit.com');

          if (!isValidDomain) {
            serverErrorWithContext('[Auth:Callback]', 'Magic link email not authorized', null, {
              email: user.email,
              expectedDomains: ['@xasecurity.ca', '@intuit.com'],
            })
            return NextResponse.redirect(`${origin}/auth/login?error=unauthorized_email`)
          }

          // Look up user by email in our users table
          serverLog('[Auth:Callback]', 'Looking up user by email for magic link', {
            email: user.email,
          })

          const { data: existingUser, error: lookupError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .eq('is_active', true)
            .single()

          if (lookupError && lookupError.code !== 'PGRST116') {
            serverErrorWithContext('[Auth:Callback]', 'Error looking up user by email', lookupError, {
              errorCode: lookupError.code,
              email: user.email,
            })
            return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
          }

          if (!existingUser) {
            serverLog('[Auth:Callback]', 'No user found with valid @xasecurity.ca email', {
              email: user.email,
            })
            return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
          }

          serverLog('[Auth:Callback]', 'User found via magic link, preparing redirect', {
            userId: existingUser.id,
            email: existingUser.email,
          })

          const totalDuration = Date.now() - startTime
          serverLog('[Auth:Callback]', 'Magic link authentication completed successfully', {
            redirectPath: next,
            totalDuration,
            scenario: 'magic_link_existing_user',
            userId: existingUser.id,
          })

          return NextResponse.redirect(`${origin}${next}`)
        }

        // Microsoft/Azure OAuth flow
        const entraId = user.id // Entra object_id is the sub claim
        serverLog('[Auth:Callback]', 'User authenticated from OAuth provider', {
          userId: entraId,
          userIdLength: entraId?.length || 0,
          email: user.email,
          provider,
          providerKeys: user.app_metadata ? Object.keys(user.app_metadata) : [],
        })

        // Log full OAuth metadata for debugging
        serverLog('[Auth:Callback]', 'Full OAuth user metadata', {
          appMetadataKeys: user.app_metadata ? Object.keys(user.app_metadata) : [],
          userMetadataKeys: user.user_metadata ? Object.keys(user.user_metadata) : [],
          identitiesCount: user.identities?.length || 0,
          lastSignInAt: user.last_sign_in_at || 'N/A',
        })

        // Log identities for troubleshooting provider linking
        if (user.identities && user.identities.length > 0) {
          serverLog('[Auth:Callback]', 'User identities from OAuth', {
            identities: user.identities.map((id) => ({
              provider: id.provider,
              identityIdLength: (id.id as string)?.length || 0,
              identityDataKeys: id.identity_data ? Object.keys(id.identity_data) : [],
            })),
          })
        }

        // Extract user information from the OAuth provider
        const email = user.email
        const phone = user.phone
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const [firstName = '', lastName = ''] = fullName.split(' ')

        serverLog('[Auth:Callback]', 'Extracted user information from OAuth provider', {
          email: email || 'N/A',
          fullName: fullName || 'N/A',
          hasPhone: !!phone,
          phoneLength: phone?.length || 0,
          firstNameLength: firstName?.length || 0,
          lastNameLength: lastName?.length || 0,
        })

        // Scenario 1: Check if user exists by Microsoft ID (most direct match)
        let existingUser = null
        serverLog('[Auth:Callback]', 'Checking for existing user by Microsoft ID', {
          microsoftId: entraId,
          microsoftIdLength: entraId?.length || 0,
        })
        const lookupStart1 = Date.now()

        const { data: userByMicrosoftId, error: mIdError } = await supabase
          .from('users')
          .select('*')
          .eq('microsoft_id', entraId)
          .single()

        if (mIdError && mIdError.code !== 'PGRST116') {
          const errorObj = mIdError as unknown as Record<string, unknown>
          serverErrorWithContext('[Auth:Callback]', 'Error looking up user by Microsoft ID', mIdError, {
            errorCode: mIdError.code,
            errorStatus: errorObj?.status,
            entraIdLength: entraId?.length || 0,
          })
        } else if (mIdError?.code === 'PGRST116') {
          serverLog('[Auth:Callback]', 'Microsoft ID lookup returned no results (expected for new users)')
        }

        if (userByMicrosoftId) {
          serverLog('[Auth:Callback]', 'User found by Microsoft ID', {
            userId: userByMicrosoftId.id,
            duration: Date.now() - lookupStart1,
            userRole: userByMicrosoftId.role,
            userIsActive: userByMicrosoftId.is_active,
          })
          existingUser = userByMicrosoftId
        } else {
          serverLog('[Auth:Callback]', 'No user found by Microsoft ID, trying email lookup', {
            queryDuration: Date.now() - lookupStart1,
          })
          // Scenario 2: Check if user exists by email (linking case)
          if (email) {
            const lookupStart2 = Date.now()
            serverLog('[Auth:Callback]', 'Looking up user by email', {
              email,
              emailLength: email.length,
            })
            const { data: userByEmail, error: emailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .eq('is_active', true)
              .single()

            if (emailError && emailError.code !== 'PGRST116') {
              const errorObj = emailError as unknown as Record<string, unknown>
              serverErrorWithContext('[Auth:Callback]', 'Error looking up user by email', emailError, {
                errorCode: emailError.code,
                errorStatus: errorObj?.status,
                email,
              })
            } else if (emailError?.code === 'PGRST116') {
              serverLog('[Auth:Callback]', 'Email lookup returned no results (expected for new users)')
            }

            if (userByEmail) {
              serverLog('[Auth:Callback]', 'Existing user found by email (account linking)', {
                userId: userByEmail.id,
                duration: Date.now() - lookupStart2,
                userRole: userByEmail.role,
                alreadyHasMicrosoftId: !!userByEmail.microsoft_id,
              })
              existingUser = userByEmail
            }
          } else {
            serverLog('[Auth:Callback]', 'No email available, skipping email lookup')
          }

          // Scenario 3: Check if user exists by phone
          if (!existingUser && phone) {
            serverLog('[Auth:Callback]', 'No email match, trying phone lookup', {
              phone,
              phoneLength: phone.length,
            })
            const lookupStart3 = Date.now()
            const { data: userByPhone, error: phoneError } = await supabase
              .from('users')
              .select('*')
              .eq('phone', phone)
              .eq('is_active', true)
              .single()

            if (phoneError && phoneError.code !== 'PGRST116') {
              const errorObj = phoneError as unknown as Record<string, unknown>
              serverErrorWithContext('[Auth:Callback]', 'Error looking up user by phone', phoneError, {
                errorCode: phoneError.code,
                errorStatus: errorObj?.status,
                phone,
              })
            } else if (phoneError?.code === 'PGRST116') {
              serverLog('[Auth:Callback]', 'Phone lookup returned no results')
            }

            if (userByPhone) {
              serverLog('[Auth:Callback]', 'Existing user found by phone (account linking)', {
                userId: userByPhone.id,
                duration: Date.now() - lookupStart3,
                userRole: userByPhone.role,
                alreadyHasMicrosoftId: !!userByPhone.microsoft_id,
              })
              existingUser = userByPhone
            }
          } else if (!existingUser) {
            serverLog('[Auth:Callback]', 'Skipping phone lookup', {
              userFound: false,
              hasPhone: !!phone,
            })
          }
        }

        // If user exists, link Microsoft ID and update metadata
        if (existingUser) {
          serverLog('[Auth:Callback]', 'Linking Microsoft account to existing user', {
            userId: existingUser.id,
            isNewLinking: !existingUser.microsoft_id,
            previousProvider: existingUser.oauth_provider || 'none',
          })

          const updateStart = Date.now()
          const updatePayload = {
            microsoft_id: entraId,
            oauth_provider: 'azure',
            oauth_metadata: {
              linked_at: new Date().toISOString(),
              email: email,
            },
            email: email || existingUser.email, // Update email if missing
          }

          serverLog('[Auth:Callback]', 'Update payload prepared', {
            willUpdateEmail: email !== existingUser.email,
            newMicrosoftId: entraId,
          })

          const { error: updateError } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', existingUser.id)

          if (updateError) {
            const errorObj = updateError as unknown as Record<string, unknown>
            serverErrorWithContext('[Auth:Callback]', 'Error linking Microsoft account', updateError, {
              userId: existingUser.id,
              errorCode: updateError.code,
              errorStatus: errorObj?.status,
            })
          } else {
            serverLog('[Auth:Callback]', 'Microsoft account linked successfully', {
              userId: existingUser.id,
              duration: Date.now() - updateStart,
              newEmail: email,
              previousEmail: existingUser.email,
            })
          }

          // Check and approve any pending account request
          if (email) {
            const requestLookupStart = Date.now()
            serverLog('[Auth:Callback]', 'Checking for pending account requests', {
              email,
              userId: existingUser.id,
            })
            const { data: pendingRequest, error: requestLookupError } = await supabase
              .from('account_requests')
              .select('*')
              .eq('email', email)
              .eq('status', 'pending')
              .single()

            if (requestLookupError && requestLookupError.code !== 'PGRST116') {
              const errorObj = requestLookupError as unknown as Record<string, unknown>
              serverErrorWithContext('[Auth:Callback]', 'Error looking up account request', requestLookupError, {
                errorCode: requestLookupError.code,
                errorStatus: errorObj?.status,
                email,
              })
            } else if (requestLookupError?.code === 'PGRST116') {
              serverLog('[Auth:Callback]', 'No pending account requests found', {
                duration: Date.now() - requestLookupStart,
              })
            }

            if (pendingRequest) {
              serverLog('[Auth:Callback]', 'Found pending account request', {
                requestId: pendingRequest.id,
                requestStatus: pendingRequest.status,
                duration: Date.now() - requestLookupStart,
              })

              const approvalStart = Date.now()
              const { error: approvalError } = await supabase
                .from('account_requests')
                .update({
                  status: 'approved',
                  reviewed_by: existingUser.id,
                  reviewed_at: new Date().toISOString(),
                  notes: 'Auto-approved via Microsoft SSO authentication',
                })
                .eq('id', pendingRequest.id)

              if (approvalError) {
                serverErrorWithContext('[Auth:Callback]', 'Error approving account request', approvalError, {
                  requestId: pendingRequest.id,
                  errorCode: approvalError.code,
                })
              } else {
                serverLog('[Auth:Callback]', 'Account request approved successfully', {
                  requestId: pendingRequest.id,
                  duration: Date.now() - approvalStart,
                })
              }
            }
          }
        } else {
          // Scenario 4: New user - create account and account_request
          serverLog('[Auth:Callback]', 'Creating new user account from Microsoft SSO', {
            email,
            fullName,
            firstName,
            lastName,
            microsoftId: entraId,
          })

          const insertStart = Date.now()
          const newUserPayload = {
            email: email,
            phone: phone || null,
            first_name: firstName || 'Unknown',
            last_name: lastName || 'User',
            microsoft_id: entraId,
            oauth_provider: 'azure',
            oauth_metadata: {
              created_via: 'microsoft_sso',
              authenticated_at: new Date().toISOString(),
            },
            role: 'staff',
            is_active: true,
          }

          serverLog('[Auth:Callback]', 'New user payload prepared', {
            hasEmail: !!email,
            hasPhone: !!phone,
            role: 'staff',
          })

          // Create user record using admin client to bypass RLS
          const supabaseAdmin = getSupabaseAdmin()
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUserPayload)
            .select()
            .single()

          if (insertError) {
            const errorObj = insertError as unknown as Record<string, unknown>
            serverErrorWithContext('[Auth:Callback]', 'Error creating user', insertError, {
              email,
              errorCode: insertError.code,
              errorStatus: errorObj?.status,
            })
            throw insertError
          }

          serverLog('[Auth:Callback]', 'New user created successfully', {
            userId: newUser?.id,
            duration: Date.now() - insertStart,
            newUserEmail: newUser?.email,
            newUserRole: newUser?.role,
          })
          existingUser = newUser

          // Assign new user to Staff permission group (lowest level for SSO users)
          if (newUser) {
            const groupAssignStart = Date.now()
            serverLog('[Auth:Callback]', 'Assigning new user to Staff permission group', {
              userId: newUser.id,
            })

            // Get the Staff permission group ID
            const { data: staffGroup, error: groupLookupError } = await supabaseAdmin
              .from('permission_groups')
              .select('id')
              .eq('name', 'Staff')
              .single()

            if (groupLookupError) {
              const errorObj = groupLookupError as unknown as Record<string, unknown>
              serverErrorWithContext('[Auth:Callback]', 'Error finding Staff permission group', groupLookupError, {
                errorCode: groupLookupError.code,
                errorStatus: errorObj?.status,
              })
              // Continue anyway - not critical
            } else if (staffGroup) {
              const { error: membershipError } = await supabaseAdmin
                .from('user_group_memberships')
                .insert({
                  user_id: newUser.id,
                  group_id: staffGroup.id,
                })

              if (membershipError) {
                const errorObj = membershipError as unknown as Record<string, unknown>
                serverErrorWithContext('[Auth:Callback]', 'Error assigning user to Staff group', membershipError, {
                  userId: newUser.id,
                  groupId: staffGroup.id,
                  errorCode: membershipError.code,
                  errorStatus: errorObj?.status,
                })
              } else {
                serverLog('[Auth:Callback]', 'User assigned to Staff permission group successfully', {
                  userId: newUser.id,
                  groupId: staffGroup.id,
                  duration: Date.now() - groupAssignStart,
                })
              }
            }
          }

          // Create auto-approved account request for audit trail
          if (newUser && email) {
            const requestStart = Date.now()
            serverLog('[Auth:Callback]', 'Creating auto-approved account request for audit trail', {
              userId: newUser.id,
              email,
            })
            const { error: requestError } = await supabaseAdmin
              .from('account_requests')
              .insert({
                first_name: firstName || 'Unknown',
                last_name: lastName || 'User',
                email: email,
                phone: phone || '',
                department: null,
                supervisor_name: 'Microsoft SSO',
                status: 'approved',
                reviewed_by: newUser.id,
                reviewed_at: new Date().toISOString(),
                notes: 'Auto-created and approved via Microsoft SSO (Single Tenant Entra)',
              })

            if (requestError) {
              const errorObj = requestError as unknown as Record<string, unknown>
              serverErrorWithContext('[Auth:Callback]', 'Error creating account request', requestError, {
                userId: newUser.id,
                email,
                errorCode: requestError.code,
                errorStatus: errorObj?.status,
              })
              // Don't fail - this is just audit trail
            } else {
              serverLog('[Auth:Callback]', 'Account request created for audit trail', {
                userId: newUser.id,
                duration: Date.now() - requestStart,
              })
            }
          }
        }

        // Step 5: Fetch and store Microsoft avatar if user has no avatar yet
        if (existingUser && !existingUser.avatar_url && sessionData?.session?.access_token) {
          serverLog('[Auth:Callback]', 'Fetching Microsoft avatar for user', {
            userId: existingUser.id,
            hasExistingAvatar: !!existingUser.avatar_url,
          })

          const avatarStart = Date.now()
          const avatarUrl = await fetchAndStoreMicrosoftAvatar(
            sessionData.session.access_token,
            existingUser.id
          )

          if (avatarUrl) {
            serverLog('[Auth:Callback]', 'Avatar fetched successfully, updating user record', {
              userId: existingUser.id,
              duration: Date.now() - avatarStart,
              avatarUrl: avatarUrl.substring(0, 100),
            })

            const { error: avatarUpdateError } = await supabase
              .from('users')
              .update({ avatar_url: avatarUrl })
              .eq('id', existingUser.id)

            if (avatarUpdateError) {
              serverError('[Auth:Callback]', 'Error updating avatar URL in database', avatarUpdateError)
            } else {
              serverLog('[Auth:Callback]', 'Avatar URL updated in database', {
                userId: existingUser.id,
              })
              existingUser.avatar_url = avatarUrl // Update in memory for response
            }
          } else {
            serverLog('[Auth:Callback]', 'No avatar available from Microsoft (user has not set one)', {
              userId: existingUser.id,
              duration: Date.now() - avatarStart,
            })
          }
        } else if (existingUser) {
          serverLog('[Auth:Callback]', 'Skipping avatar fetch', {
            userId: existingUser.id,
            hasAccessToken: !!sessionData?.session?.access_token,
            alreadyHasAvatar: !!existingUser.avatar_url,
          })
        }

        // Redirect to dashboard — pass welcome flag only for first-time Microsoft users
        if (existingUser) {
          const isFirstTimeMicrosoft = !existingUser.microsoft_id
          const welcomeFlag = isFirstTimeMicrosoft ? '?welcome=1' : ''

          const totalDuration = Date.now() - startTime
          const scenario = isFirstTimeMicrosoft ? 'new_user_created' : 'existing_user_linked'
          serverLog('[Auth:Callback]', 'OAuth callback completed successfully', {
            redirectPath: next,
            totalDuration,
            scenario,
            userId: existingUser.id,
          })

          const redirectUrl = `${origin}${next}${welcomeFlag}`
          serverLog('[Auth:Callback]', 'Redirecting to dashboard', {
            redirectUrl: redirectUrl.substring(0, 100),
            scenario,
          })

          return NextResponse.redirect(redirectUrl)
        }
      }

      serverError('[Auth:Callback]', 'No user data found in OAuth session', null)
      serverLog('[Auth:Callback]', 'Redirecting to login due to missing user data', {
        hasSessionData: !!sessionData,
        hasUser: !!sessionData?.user,
      })
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
    } catch (error) {
      const totalDuration = Date.now() - startTime
      serverErrorWithContext('[Auth:Callback]', 'OAuth callback handler failed with exception', error, {
        totalDuration,
        hasCode: !!code,
        origin,
      })
      serverLog('[Auth:Callback]', 'Total callback duration before error', {
        totalDuration,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      })
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
    }
  }

  // If no code, redirect to error page
  const allParams = Object.fromEntries(searchParams)
  serverLog('[Auth:Callback]', 'No authorization code provided in callback', {
    origin,
    hasSearchParams: Object.keys(allParams).length > 0,
    paramKeys: Object.keys(allParams).slice(0, 5), // First 5 param keys
    errorParam: searchParams.get('error'),
    errorDescription: searchParams.get('error_description') || 'N/A',
  })
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
