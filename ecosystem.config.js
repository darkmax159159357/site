module.exports = {
  apps: [
    {
      name: 'medusascans-site',
      cwd: '/home/medusascans',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'admin-dashboard',
      cwd: '/home/admin',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    }
  ]
};
