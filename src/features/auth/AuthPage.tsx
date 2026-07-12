/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, memo, useCallback} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useToast} from '../../contexts/ToastContext';
import {EntityForm} from '../../components/forms/EntityForm';
import {
  FormRow,
  TextInput,
  SelectBox,
  Checkbox
} from '../../components/ui/FormControls';
import {loginSchema, LoginFormValues} from '../../schemas/validation';
import {Truck, ShieldAlert, Key} from 'lucide-react';
import {motion} from 'motion/react';

export const AuthPage = memo(function AuthPage() {
  const {login} = useAuth();
  const {addToast} = useToast();
  
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = useCallback(async (values: LoginFormValues) => {
    setAuthError(null);
    
    // Simulate short network delay for SaaS realism
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Try authenticating
    const success = login(values.email, values.role, values.rememberMe);

    if (success) {
      addToast(
        'Authentication Successful',
        `Welcome back to TransitOps. Authorized as ${values.role.replace('_', ' ')}.`,
        'success'
      );
    } else {
      setAuthError('Invalid credentials or unauthorized role allocation.');
      addToast('Sign-In Failed', 'Please verify input credentials.', 'error');
    }
  }, [login, addToast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base px-4 py-12 relative select-none overflow-hidden">
      
      {/* Visual background details (Minimalist geometric glows) */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-status-dispatched/5 filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-status-available/5 filter blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3, ease: 'easeOut'}}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-status-dispatched flex items-center justify-center text-white font-extrabold text-xl font-display shadow-md shadow-status-dispatched/20 mb-3">
            T
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-text-base">
            TransitOps Enterprise
          </h1>
          <p className="text-xs text-text-muted mt-1.5">
            Log in to manage logistics, assets, and operator schedules.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-card border border-border-base rounded-2xl p-6 sm:p-8 shadow-xl">
          
          {authError && (
            <div className="flex items-start gap-2.5 bg-status-inshop/10 border border-status-inshop/25 text-status-inshop rounded-lg p-3 text-xs font-semibold mb-5 animate-slide-in">
              <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <EntityForm<LoginFormValues>
            schema={loginSchema}
            onSubmit={handleSignIn}
            defaultValues={{
              email: 'manager@transitops.com',
              password: '••••••••',
              role: 'FLEET_MANAGER',
              rememberMe: true,
            }}
          >
            {({register, formState: {errors, isSubmitting}}) => (
              <div className="space-y-4">
                
                <FormRow label="Corporate Email Address" error={errors.email?.message} required>
                  <TextInput
                    {...register('email')}
                    type="email"
                    placeholder="e.g. manager@transitops.com"
                    error={!!errors.email}
                    autoComplete="email"
                  />
                </FormRow>

                <FormRow label="Security Password" error={errors.password?.message} required>
                  <TextInput
                    {...register('password')}
                    type="password"
                    placeholder="Enter security password"
                    error={!!errors.password}
                    autoComplete="current-password"
                  />
                </FormRow>

                <FormRow label="Authorized Role Authorization" error={errors.role?.message} required>
                  <SelectBox
                    {...register('role')}
                    error={!!errors.role}
                    options={[
                      {value: 'FLEET_MANAGER', label: 'Fleet Manager'},
                      {value: 'DRIVER', label: 'Commercial Driver'},
                      {value: 'SAFETY_OFFICER', label: 'Safety & Compliance Officer'},
                      {value: 'FINANCIAL_ANALYST', label: 'Financial Analyst'},
                    ]}
                  />
                </FormRow>

                <div className="flex items-center justify-between pt-1 pb-2">
                  <Checkbox
                    {...register('rememberMe')}
                    label="Remember my corporate session"
                  />
                  <span className="text-[11px] font-bold text-status-dispatched hover:underline cursor-pointer">
                    Forgot Password?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-status-dispatched text-white hover:bg-opacity-95 rounded-lg text-xs font-bold shadow-sm shadow-status-dispatched/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <span>Allocating session...</span>
                  ) : (
                    <>
                      <Key size={14} />
                      <span>Authorize Session</span>
                    </>
                  )}
                </button>

              </div>
            )}
          </EntityForm>

          {/* Quick Mock Login Assistance */}
          <div className="border-t border-border-base mt-6 pt-5">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center mb-3">
              Mock Credentials for Testing
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted font-medium">
              <div className="bg-bg-base/60 border border-border-base rounded-md p-2">
                <span className="font-bold block text-text-base mb-0.5">Fleet Manager</span>
                manager@transitops.com
              </div>
              <div className="bg-bg-base/60 border border-border-base rounded-md p-2">
                <span className="font-bold block text-text-base mb-0.5">Analyst</span>
                analyst@transitops.com
              </div>
            </div>
          </div>

        </div>

        {/* Security watermark */}
        <div className="text-center text-[10px] text-text-muted font-semibold mt-6">
          TransitOps Secured Client Terminal • System v1.4.2
        </div>

      </motion.div>
    </div>
  );
});
