'use strict';

const client = require('prom-client');
const pm2 = require('pm2');

clearInterval(client.defaultMetrics());
client.register.clear();

const labels = ['name', 'instance'];

let connectProm;
function connect() {
    if (connectProm) return connectProm;
    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function getList() {
    return connect().then(() => new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) return reject(err);
            resolve(list);
        });
    }));
}

exports.getMetrics = function () {
    return getList().then((list) => {
        const currentTime = Date.now();
        client.register.clear();
        const pm2Up = new client.Gauge('pm2_up', 'Is the process running', labels);
        const pm2Uptime = new client.Gauge('pm2_uptime_seconds', 'Process uptime', labels);
        const pm2Instances = new client.Gauge('pm2_instances', 'Process instances', labels);
        const pm2Restarts = new client.Gauge('pm2_restarts', 'Process restarts', labels);
        const pm2Cpu = new client.Gauge('pm2_cpu', 'Process cpu usage', labels);
        const pm2Memory = new client.Gauge('pm2_memory', 'Process memory usage', labels);
        list.forEach((proc) => {
            const app = {
                name: proc.name,
                instance: proc.pm2_env.NODE_APP_INSTANCE
            };
            const up = proc.pm2_env.status === 'online' ? 1 : 0;
            pm2Up.set(app, up);
            pm2Uptime.set(app, Math.round((currentTime - proc.pm2_env.pm_uptime) / 1000));
            pm2Instances.set(app, proc.pm2_env.instances);
            pm2Restarts.set(app, proc.pm2_env.unstable_restarts);
            pm2Cpu.set(app, proc.monit.cpu);
            pm2Memory.set(app, proc.monit.memory);
        });
        return client.register.metrics();
    });
};
