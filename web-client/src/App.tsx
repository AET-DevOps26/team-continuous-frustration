import { useState } from 'react'
import {
  loginUser,
  logoutUser,
  registerUser,
  type AuthResponse,
} from './auth/authApi'
import {
  clearAuthData,
  getStoredUser,
  getToken,
  saveAuthData,
  type StoredUser,
} from './auth/authStorage'
import './App.css'

type View = 'login' | 'signup' | 'dashboard'

function App() {
  const initialUser = getStoredUser()

  const [view, setView] = useState<View>(initialUser ? 'dashboard' : 'login')
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(initialUser)
  const [message, setMessage] = useState('')

  const handleAuthSuccess = (response: AuthResponse) => {
    if (!response.token) {
      setMessage('Login succeeded, but no token was returned.')
      return
    }

    const user = {
      userId: response.userId,
      username: response.username,
      email: response.email,
    }

    saveAuthData(response.token, user)
    setCurrentUser(user)
    setView('dashboard')
    setMessage('')
  }

  const handleLogout = async () => {
    const token = getToken()

    try {
      if (token) {
        await logoutUser(token)
      }
    } catch (error) {
      console.error(error)
    } finally {
      clearAuthData()
      setCurrentUser(null)
      setView('login')
      setMessage('Logged out successfully.')
    }
  }

  return (
    <main className="app">
      <section className="card">
        <h1>AI-based Anki</h1>
        <p className="subtitle">Signup, login, and logout with JWT authentication</p>

        {message && <p className="message">{message}</p>}

        {view === 'login' && (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onSwitchToSignup={() => {
              setMessage('')
              setView('signup')
            }}
            setMessage={setMessage}
          />
        )}

        {view === 'signup' && (
          <SignupForm
            onSignupSuccess={() => {
              setMessage('Registration successful. Please log in.')
              setView('login')
            }}
            onSwitchToLogin={() => {
              setMessage('')
              setView('login')
            }}
            setMessage={setMessage}
          />
        )}

        {view === 'dashboard' && currentUser && (
          <Dashboard user={currentUser} onLogout={handleLogout} />
        )}
      </section>
    </main>
  )
}

type LoginFormProps = {
  onLoginSuccess: (response: AuthResponse) => void
  onSwitchToSignup: () => void
  setMessage: (message: string) => void
}

function LoginForm({
  onLoginSuccess,
  onSwitchToSignup,
  setMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState('siyao@example.com')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await loginUser({ email, password })
      onLoginSuccess(response)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={submitLogin}>
      <h2>Login</h2>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <button type="button" className="link-button" onClick={onSwitchToSignup}>
        No account yet? Sign up
      </button>
    </form>
  )
}

type SignupFormProps = {
  onSignupSuccess: () => void
  onSwitchToLogin: () => void
  setMessage: (message: string) => void
}

function SignupForm({
  onSignupSuccess,
  onSwitchToLogin,
  setMessage,
}: SignupFormProps) {
  const [username, setUsername] = useState('siyao')
  const [email, setEmail] = useState('siyao@example.com')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)

  const submitSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await registerUser({ username, email, password })
      onSignupSuccess()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={submitSignup}>
      <h2>Sign up</h2>

      <label>
        Username
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <button type="button" className="link-button" onClick={onSwitchToLogin}>
        Already have an account? Login
      </button>
    </form>
  )
}

type DashboardProps = {
  user: StoredUser
  onLogout: () => void
}

function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="dashboard">
      <h2>Welcome, {user.username}</h2>
      <p>You are logged in as:</p>
      <p className="user-email">{user.email}</p>

      <button onClick={onLogout}>Logout</button>
    </div>
  )
}

export default App