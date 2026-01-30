import React, { useState } from 'react';

type AdminLoginCardProps = {
  title?: string;
  description?: string;
  error?: string;
  busy?: boolean;
  onLogin: (username: string, password: string) => void;
};

const AdminLoginCard: React.FC<AdminLoginCardProps> = ({
  title = 'Admin Access',
  description = 'Authorized administrators only.',
  error,
  busy,
  onLogin
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(username.trim(), password);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="pill">Private</div>
        <h1 className="font-display text-2xl font-bold text-[#2D3561]">{title}</h1>
        <p className="font-body text-sm text-[#3A3A3A]/70 mt-2">{description}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="field block">
            <span className="label">Username</span>
            <input
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              disabled={busy}
              className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </label>

          <label className="field block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={busy}
              className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </label>

          {error ? (
            <div className="text-sm text-red-600 font-body">{error}</div>
          ) : null}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#2D3561] text-white font-display font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
            disabled={busy}
          >
            {busy ? 'Checking access...' : 'Enter'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginCard;
