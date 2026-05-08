import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getInitials } from '@/utils/formatters'

interface ProfileForm {
  firstName: string
  lastName: string
  phone: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Settings() {
  const { user, refetchUser } = useAuth()
  const [profileSuccess, setProfileSuccess] = useState(false)

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.first_name ?? '',
      lastName: user?.last_name ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>()

  const profileMutation = useMutation(
    (data: ProfileForm) => api.put('/auth/profile', data).then(r => r.data),
    {
      onSuccess: async () => {
        await refetchUser()
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
        toast.success('Profile updated!')
      },
      onError: () => toast.error('Failed to update profile'),
    }
  )

  const passwordMutation = useMutation(
    (data: PasswordForm) =>
      api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    {
      onSuccess: () => {
        toast.success('Password changed!')
        passwordForm.reset()
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(msg ?? 'Failed to change password')
      },
    }
  )

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }
    passwordMutation.mutate(data)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
            {getInitials(user.first_name, user.last_name)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <h3 className="section-title mb-4">Profile Information</h3>
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              Profile updated successfully!
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                {...profileForm.register('firstName', { required: 'Required' })}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                {...profileForm.register('lastName', { required: 'Required' })}
              />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+1 (555) 000-0000" {...profileForm.register('phone')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input bg-gray-50"
              value={user.email}
              disabled
              readOnly
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileMutation.isLoading}
              className="btn-primary"
            >
              {profileMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Change Password</h3>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              {...passwordForm.register('currentPassword', { required: 'Required' })}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              {...passwordForm.register('newPassword', {
                required: 'Required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              {...passwordForm.register('confirmPassword', { required: 'Required' })}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordMutation.isLoading}
              className="btn-primary"
            >
              {passwordMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
