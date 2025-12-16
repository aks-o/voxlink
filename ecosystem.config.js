// PM2 Ecosystem Configuration for VoxLink
// Use: pm2 start ecosystem.config.js

module.exports = {
    apps: [
        {
            name: 'voxlink-api-gateway',
            script: './packages/api-gateway/dist/index.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
            },
            max_memory_restart: '500M',
            error_file: './logs/api-gateway-error.log',
            out_file: './logs/api-gateway-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'voxlink-number-service',
            script: './packages/number-service/dist/index.js',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            max_memory_restart: '300M',
            error_file: './logs/number-service-error.log',
            out_file: './logs/number-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'voxlink-billing-service',
            script: './packages/billing-service/dist/index.js',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
            },
            max_memory_restart: '300M',
            error_file: './logs/billing-service-error.log',
            out_file: './logs/billing-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'voxlink-notification-service',
            script: './packages/notification-service/dist/index.js',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                PORT: 3003,
            },
            max_memory_restart: '200M',
            error_file: './logs/notification-service-error.log',
            out_file: './logs/notification-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],

    deploy: {
        production: {
            user: 'deploy',
            host: 'your-cyfuture-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-repo/voxlink.git',
            path: '/var/www/voxlink',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
        },
    },
};
