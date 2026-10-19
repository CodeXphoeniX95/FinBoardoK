import { useState } from 'react';
import { register, login } from '../utils/data';
import { validateEmail } from '../utils/helpers';
import { IconWallet, IconEye, IconEyeOff } from './Icons';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = formData.email.trim();

    if (!validateEmail(cleanEmail)) {
      setError('Adresse e-mail invalide.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(cleanEmail, formData.password);
      } else {
        result = await register(cleanEmail, formData.password);
      }

      if (!result.success) {
        let msg = result.error || 'Une erreur est survenue';
        if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('Invalid login credentials')) {
          msg = 'Identifiants incorrects ou compte inexistant. Si vous n\'avez pas de compte, cliquez sur "Pas encore de compte ? Inscris-toi" ci-dessous.';
        } else if (msg.includes('auth/email-already-in-use') || msg.includes('User already registered')) {
          msg = 'Cet e-mail est déjà enregistré. Veuillez vous connecter.';
        } else if (msg.includes('is invalid') || msg.includes('invalid email')) {
          msg = 'Format d\'adresse email non valide. Vérifiez qu\'il n\'y a pas d\'espace superflue.';
        } else if (msg.includes('auth/weak-password') || msg.includes('Password should be at least 6 characters')) {
          msg = 'Le mot de passe doit contenir au moins 6 caractères.';
        }
        setError(msg);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.png" alt="Heleanaf Logo" className="auth-logo-img" />
          <h1 className="auth-title">Heleanaf</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Connexion à votre espace financier' : 'Création de votre compte professionnel'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nom@domaine.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Chargement en cours...' : (isLogin ? 'Se connecter' : 'Créer un compte')}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            type="button" 
            className="auth-toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setShowPassword(false);
              setShowConfirmPassword(false);
              setFormData({ email: '', password: '', confirmPassword: '' });
            }}
          >
            {isLogin 
              ? "Pas encore de compte ? Inscris-toi" 
              : "Déjà un compte ? Connecte-toi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;