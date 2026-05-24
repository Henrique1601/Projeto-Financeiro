const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');
const { getOne, run } = require('../utils/queryHelpers');

function createPassport() {
  const passport = require('passport');

  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  const verifyCallback = (provider) => async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, displayName, emails, photos } = profile;
      const email = emails?.[0]?.value || null;
      const nome = displayName?.split(' ')[0] || 'Usuário';
      const sobrenome = displayName?.split(' ').slice(1).join(' ') || '';
      const foto = photos?.[0]?.value || '';

      let user = await getOne('SELECT * FROM usuarios WHERE social_id = $1 AND provider = $2', [id, provider]);

      if (!user) {
        if (email) {
          const existing = await getOne('SELECT * FROM usuarios WHERE email = $1', [email]);
          if (existing) {
            if (!existing.social_id) {
              await run('UPDATE usuarios SET social_id = $1, provider = $2, foto = $3 WHERE id = $4', [id, provider, foto, existing.id]);
            }
            user = existing;
          }
        }

        if (!user) {
          const userId = await run(
            'INSERT INTO usuarios (nome, sobrenome, email, senha, social_id, provider, foto) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [nome, sobrenome, email || `${provider}_${id}@placeholder.com`, null, id, provider, foto]
          );
          user = await getOne('SELECT * FROM usuarios WHERE id = $1', [userId]);
        }
      }

      const token = jwt.sign(
        { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, provider: user.provider },
        secret,
        { expiresIn }
      );

      return done(null, { token, nome: user.nome, sobrenome: user.sobrenome, email: user.email, foto: user.foto });
    } catch (err) {
      return done(err, null);
    }
  };

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/api/auth/google/callback`
    }, verifyCallback('google')));
    console.log('Estratégia Google OAuth configurada');
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use('github', new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${baseUrl}/api/auth/github/callback`
    }, verifyCallback('github')));
    console.log('Estratégia GitHub OAuth configurada');
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  return passport;
}

module.exports = { createPassport };
