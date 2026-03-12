import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

// Auth context
const AuthContext = createContext(null)

function useAuth() {
  return useContext(AuthContext)
}

// Toast system
let toastTimeout
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  clearTimeout(toastTimeout)

  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  toastTimeout = setTimeout(() => toast.remove(), 3000)
}

// Format date
function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ============================================================
// AUTH PAGE
// ============================================================
function AuthPage() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signup(username, password, displayName || username)
      } else {
        await login(username, password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <span className="logo-icon">BR</span>
          <h1>BetRelease</h1>
          <p>Predict AI model releases. Win coins. Beat your friends.</p>
        </div>

        <div className="auth-card">
          <div className="auth-toggle">
            <button
              className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >
              Log In
            </button>
            <button
              className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="How others see you"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signup' && (
            <div className="auth-bonus">
              <span className="auth-bonus-emoji">+</span>
              <span className="auth-bonus-text">
                Sign up and get 1,000 free coins to start betting
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// HEADER
// ============================================================
function Header({ page, setPage }) {
  const { user, logout, claimCoins } = useAuth()
  const [claiming, setClaiming] = useState(false)

  const canClaim = user && (Date.now() - user.lastCoinClaim) > 24 * 60 * 60 * 1000

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await claimCoins()
      showToast('+50 coins claimed', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setClaiming(false)
  }

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="logo" onClick={() => setPage('home')}>
            <span className="logo-icon">BR</span>
            <span className="logo-text">BetRelease</span>
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${page === 'home' ? 'active' : ''}`}
              onClick={() => setPage('home')}
            >
              Markets
            </button>
            <button
              className={`nav-btn ${page === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setPage('leaderboard')}
            >
              Leaderboard
            </button>
            <button
              className={`nav-btn ${page === 'profile' ? 'active' : ''}`}
              onClick={() => setPage('profile')}
            >
              Portfolio
            </button>
          </nav>
        </div>

        <div className="header-right">
          {canClaim && (
            <button className="claim-btn" onClick={handleClaim} disabled={claiming}>
              <span className="shimmer"></span>
              {claiming ? '...' : 'Claim +50'}
            </button>
          )}

          <div className="coin-display">
            <span className="coin-icon">C</span>
            {user?.coins?.toLocaleString() || 0}
          </div>

          <button className="user-menu-btn" onClick={() => setPage('profile')}>
            <div className="user-avatar">
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <span>{user?.displayName || 'User'}</span>
          </button>

          <button className="nav-btn" onClick={logout} title="Logout" style={{fontSize: '16px'}}>
            ↪
          </button>
        </div>
      </div>
    </header>
  )
}

// ============================================================
// HOME PAGE - Markets List
// ============================================================
function HomePage({ setPage, setSelectedMarket }) {
  const { seedMarkets } = useAuth()
  const [category, setCategory] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const markets = useQuery(api.markets.listMarkets, {
    category: category || undefined,
    showResolved: false,
  })

  const categories = ['All', 'OpenAI', 'Anthropic', 'Google', 'Meta', 'xAI', 'Mistral', 'DeepSeek', 'Apple', 'AGI']

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedMarkets()
      showToast('12 AI prediction markets created! 🚀', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSeeding(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prediction Markets</h1>
        <p className="page-subtitle">Bet on the next big AI model release</p>
      </div>

      <div className="category-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${(cat === 'All' && !category) || category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat === 'All' ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {!markets ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : markets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">+</div>
          <div className="empty-state-title">No markets yet</div>
          <p>Be the first to get started</p>
          <button
            className="auth-submit"
            style={{ maxWidth: 300, margin: '20px auto 0' }}
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? 'Creating markets...' : 'Load AI Prediction Markets'}
          </button>
        </div>
      ) : (
        <div className="markets-grid">
          {markets.map((market) => (
            <MarketCard
              key={market._id}
              market={market}
              onClick={() => {
                setSelectedMarket(market._id)
                setPage('market')
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MARKET CARD
// ============================================================
function MarketCard({ market, onClick }) {
  const daysLeft = Math.max(0, Math.ceil((market.endDate - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="market-card" onClick={onClick}>
      <div className="market-card-top">
        <div className="market-emoji">{market.category?.[0] || '?'}</div>
        <div>
          <div className="market-title">{market.title}</div>
          <div className="market-meta">
            <span className="market-category">{market.category}</span>
            <span className="market-deadline">
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
            </span>
          </div>
        </div>
      </div>

      <div className="prob-bar-container">
        <div className="prob-labels">
          <span className="prob-label yes">Yes {market.yesProbability}%</span>
          <span className="prob-label no">No {market.noProbability}%</span>
        </div>
        <div className="prob-bar">
          <div className="prob-bar-fill" style={{ width: `${market.yesProbability}%` }}></div>
        </div>
      </div>

      <div className="market-footer">
        <div className="market-volume">
          Vol: <span>{market.totalVolume.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MARKET DETAIL PAGE
// ============================================================
function MarketPage({ marketId, setPage }) {
  const { user, token } = useAuth()
  const market = useQuery(api.markets.getMarket, { marketId, token: token || undefined })
  const placeBetMutation = useMutation(api.bets.placeBet)

  const [side, setSide] = useState('yes')
  const [amount, setAmount] = useState(50)
  const [betting, setBetting] = useState(false)

  if (!market) {
    return <div className="loading-spinner"><div className="spinner"></div></div>
  }

  const daysLeft = Math.max(0, Math.ceil((market.endDate - Date.now()) / (1000 * 60 * 60 * 24)))
  const isEnded = market.endDate < Date.now() || market.resolved

  // Calculate potential payout
  const currentSideCoins = side === 'yes' ? market.totalYesCoins : market.totalNoCoins
  const otherSideCoins = side === 'yes' ? market.totalNoCoins : market.totalYesCoins
  const totalCoins = currentSideCoins + otherSideCoins
  let potentialPayout = amount
  if (totalCoins === 0) {
    potentialPayout = amount * 2
  } else {
    const price = Math.max(0.05, Math.min(0.95, (currentSideCoins + amount / 2) / (totalCoins + amount)))
    const shares = Math.round(amount / price)
    const newTotal = totalCoins + amount
    potentialPayout = Math.round(shares / ((side === 'yes' ? market.totalYesShares : market.totalNoShares) + shares) * newTotal)
  }

  const handleBet = async () => {
    if (!token) return
    setBetting(true)
    try {
      const result = await placeBetMutation({
        token,
        marketId,
        side,
        amount: parseInt(amount),
      })
      showToast(`Bet placed — ${result.shares} shares`, 'success')
      setAmount(50)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setBetting(false)
  }

  return (
    <div>
      <button className="back-btn" onClick={() => setPage('home')}>
        ← Back to Markets
      </button>

      <div className="market-detail">
        <div className="market-main">
          <div className="detail-card">
            {market.resolved && (
              <div className={`resolved-badge ${market.outcome ? 'yes' : 'no'}`}>
                {market.outcome ? 'Resolved YES' : 'Resolved NO'}
              </div>
            )}
            <div className="detail-emoji">{market.category?.[0] || '?'}</div>
            <h1 className="detail-title">{market.title}</h1>
            <p className="detail-description">{market.description}</p>

            <div className="prob-bar-container" style={{ marginBottom: 24 }}>
              <div className="prob-labels">
                <span className="prob-label yes">Yes {market.yesProbability}%</span>
                <span className="prob-label no">No {market.noProbability}%</span>
              </div>
              <div className="prob-bar" style={{ height: 12 }}>
                <div className="prob-bar-fill" style={{ width: `${market.yesProbability}%` }}></div>
              </div>
            </div>

            <div className="detail-stats">
              <div className="stat-box">
                <div className="stat-value yes">{market.yesProbability}%</div>
                <div className="stat-label">Yes Chance</div>
              </div>
              <div className="stat-box">
                <div className="stat-value volume">{market.totalVolume.toLocaleString()}</div>
                <div className="stat-label">Total Volume</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{daysLeft > 0 ? `${daysLeft}d` : 'Ended'}</div>
                <div className="stat-label">Time Left</div>
              </div>
            </div>
          </div>

          {/* User's bets on this market */}
          {market.userBets && market.userBets.length > 0 && (
            <div className="detail-card">
              <div className="user-bets-title">Your Positions</div>
              {market.userBets.map((bet, i) => (
                <div key={i} className="user-bet-item">
                  <span className={`user-bet-side ${bet.side}`}>{bet.side}</span>
                  <span>{bet.shares} shares</span>
                  <span style={{ color: 'var(--text-muted)' }}>{bet.amount} coins</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {formatTimeAgo(bet.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bet Panel */}
        <div className="bet-panel">
          <div className="detail-card">
            <div className="bet-panel-title">
              {isEnded ? 'Market Closed' : 'Place Your Bet'}
            </div>

            {!isEnded && (
              <>
                <div className="side-toggle">
                  <button
                    className={`side-btn yes ${side === 'yes' ? 'active' : ''}`}
                    onClick={() => setSide('yes')}
                  >
                    Yes
                  </button>
                  <button
                    className={`side-btn no ${side === 'no' ? 'active' : ''}`}
                    onClick={() => setSide('no')}
                  >
                    No
                  </button>
                </div>

                <div className="amount-input-group">
                  <div className="amount-label">
                    <span className="amount-label-title">Amount</span>
                    <span className="amount-balance">Balance: {user?.coins?.toLocaleString() || 0}</span>
                  </div>
                  <div className="amount-input-wrapper">
                    <span className="amount-prefix">C</span>
                    <input
                      className="amount-input"
                      type="number"
                      min="1"
                      max={user?.coins || 0}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    />
                  </div>
                  <div className="amount-presets">
                    {[10, 50, 100, 250].map((preset) => (
                      <button key={preset} className="preset-btn" onClick={() => setAmount(preset)}>
                        {preset}
                      </button>
                    ))}
                    <button className="preset-btn" onClick={() => setAmount(user?.coins || 0)}>
                      MAX
                    </button>
                  </div>
                </div>

                <div className="bet-preview">
                  <div className="bet-preview-row">
                    <span className="bet-preview-label">Side</span>
                    <span className="bet-preview-value" style={{ color: side === 'yes' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {side.toUpperCase()}
                    </span>
                  </div>
                  <div className="bet-preview-row">
                    <span className="bet-preview-label">Amount</span>
                    <span className="bet-preview-value">{amount} coins</span>
                  </div>
                  <div className="bet-preview-row">
                    <span className="bet-preview-label">Potential Payout</span>
                    <span className="bet-preview-value payout">~{potentialPayout.toLocaleString()} coins</span>
                  </div>
                </div>

                <button
                  className={`place-bet-btn ${side}-bet`}
                  onClick={handleBet}
                  disabled={betting || amount < 1 || amount > (user?.coins || 0)}
                >
                  {betting ? 'Placing...' : `Bet ${amount} on ${side.toUpperCase()}`}
                </button>
              </>
            )}

            {isEnded && (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>This market is no longer accepting bets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LEADERBOARD PAGE
// ============================================================
function LeaderboardPage() {
  const leaderboard = useQuery(api.users.getLeaderboard)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Top predictors ranked by total coins</p>
      </div>

      {!leaderboard ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-title">No players yet</div>
          <p>Be the first to join</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry) => (
            <div
              key={entry._id}
              className={`leaderboard-item ${entry.rank === 1 ? 'top-1' : ''} ${entry.rank === 2 ? 'top-2' : ''} ${entry.rank === 3 ? 'top-3' : ''}`}
            >
              <div className={`lb-rank ${entry.rank === 1 ? 'gold' : ''} ${entry.rank === 2 ? 'silver' : ''} ${entry.rank === 3 ? 'bronze' : ''}`}>
                {entry.rank <= 3 ? ['1st', '2nd', '3rd'][entry.rank - 1] : entry.rank}
              </div>
              <div className="lb-info">
                <div className="lb-name">{entry.displayName}</div>
                <div className="lb-username">@{entry.username}</div>
              </div>
              <div className="lb-coins">
                {entry.coins.toLocaleString()} coins
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// PROFILE PAGE
// ============================================================
function ProfilePage() {
  const { token } = useAuth()
  const profile = useQuery(api.users.getProfile, { token: token || undefined })
  const userBets = useQuery(api.bets.getUserBets, { token: token || undefined })

  if (!profile) {
    return <div className="loading-spinner"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Your Portfolio</h1>
      </div>

      <div className="detail-card profile-header-card">
        <div className="profile-avatar">
          {profile.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <h2>{profile.displayName}</h2>
          <div className="username">@{profile.username}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{profile.coins.toLocaleString()}</strong> coins
            </div>
            <div className="profile-stat">
              <strong>{profile.totalBets}</strong> bets placed
            </div>
            <div className="profile-stat">
              Joined <strong>{formatDate(profile.createdAt)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Active Bets */}
      {userBets && userBets.length > 0 && (
        <>
          <h3 className="profile-section-title">Your Bets</h3>
          <div className="leaderboard-list">
            {userBets.map((bet) => (
              <div key={bet._id} className="leaderboard-item">
                <div className="market-emoji">{bet.marketCategory?.[0] || '?'}</div>
                <div className="lb-info">
                  <div className="lb-name" style={{ fontSize: 14 }}>{bet.marketTitle}</div>
                  <div className="lb-username">
                    <span className={`user-bet-side ${bet.side}`}>{bet.side.toUpperCase()}</span>
                    {' '}{bet.shares} shares • {formatTimeAgo(bet.timestamp)}
                  </div>
                </div>
                <div className="lb-coins" style={{ fontSize: 14 }}>
                  {bet.amount} coins
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Transaction History */}
      {profile.transactions && profile.transactions.length > 0 && (
        <>
          <h3 className="profile-section-title">Recent Activity</h3>
          <div className="transaction-list">
            {profile.transactions.map((tx) => (
              <div key={tx._id} className="transaction-item">
                <div>
                  <div className="transaction-desc">{tx.description}</div>
                  <div className="transaction-time">{formatTimeAgo(tx.timestamp)}</div>
                </div>
                <div className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// MAIN APP WITH AUTH PROVIDER
// ============================================================
function AppContent() {
  const { user } = useAuth()
  const [page, setPage] = useState('home')
  const [selectedMarket, setSelectedMarket] = useState(null)

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="app">
      <Header page={page} setPage={setPage} />
      <div className="app-content">
        {page === 'home' && <HomePage setPage={setPage} setSelectedMarket={setSelectedMarket} />}
        {page === 'market' && selectedMarket && <MarketPage marketId={selectedMarket} setPage={setPage} />}
        {page === 'leaderboard' && <LeaderboardPage />}
        {page === 'profile' && <ProfilePage />}
      </div>
    </div>
  )
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('betrelease_token'))
  const user = useQuery(api.auth.getMe, { token: token || undefined })
  const signupMutation = useMutation(api.auth.signup)
  const loginMutation = useMutation(api.auth.login)
  const logoutMutation = useMutation(api.auth.logout)
  const claimMutation = useMutation(api.users.claimDailyCoins)
  const seedMutation = useMutation(api.seed.seedMarkets)

  const login = useCallback(async (username, password) => {
    const result = await loginMutation({ username, password })
    localStorage.setItem('betrelease_token', result.token)
    setToken(result.token)
  }, [loginMutation])

  const signup = useCallback(async (username, password, displayName) => {
    const result = await signupMutation({ username, password, displayName })
    localStorage.setItem('betrelease_token', result.token)
    setToken(result.token)
  }, [signupMutation])

  const logout = useCallback(async () => {
    if (token) {
      try { await logoutMutation({ token }) } catch {}
    }
    localStorage.removeItem('betrelease_token')
    setToken(null)
  }, [token, logoutMutation])

  const claimCoins = useCallback(async () => {
    if (!token) throw new Error('Not logged in')
    return await claimMutation({ token })
  }, [token, claimMutation])

  const seedMarkets = useCallback(async () => {
    if (!token) throw new Error('Not logged in')
    return await seedMutation({ token })
  }, [token, seedMutation])

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, claimCoins, seedMarkets }}>
      {children}
    </AuthContext.Provider>
  )
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConvexProvider>
  )
}

export default App
