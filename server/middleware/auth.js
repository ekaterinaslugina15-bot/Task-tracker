const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === 'Bearer demo_token_2024') {
    req.user = { id: 'demo_user', name: 'cutlet09' };
    next();
  } else {
    res.status(401).json({ error: 'Не авторизован' });
  }
};

module.exports = authMiddleware;