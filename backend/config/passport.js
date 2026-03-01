const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // Try to find by googleId first
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Try to find by email (user may have registered locally)
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing local account
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (profile.photos?.[0]?.value && !user.profilePicture) {
              user.profilePicture = profile.photos[0].value;
            }
            await user.save();
          } else {
            // Create a brand-new user via Google
            user = await User.create({
              name: profile.displayName || email.split('@')[0],
              email,
              googleId: profile.id,
              authProvider: 'google',
              profilePicture: profile.photos?.[0]?.value || null,
              // phone left blank — user can fill in profile later
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
