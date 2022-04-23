const ping_interval = 5;

const dayjs = require('dayjs');

const fs = require('fs');
const path = require('path');
let logs = {};
const log_dir = './logs';
if(!fs.existsSync(log_dir)) fs.mkdirSync(log_dir);

const list_path = path.join(__dirname, 'list.json');
if(!fs.existsSync(list_path)) {
    const template = [
        {
            "category": "A",
            "instance": {
                "name1": "192.168.0.2",
                "name2": "192.168.0.3"
            }
        },
        {
            "category": "B",
            "instance": {
                "name3": "192.168.0.11"
            }
        },
        {
            "category": "wan",
            "instance": {
                "google-dns": "8.8.8.8"
            }
        }
    ];    
    fs.writeFileSync(list_path, JSON.stringify(template, null, 4));
}

const list = JSON.parse(fs.readFileSync(list_path, 'utf8'));

const results = {};
list.forEach(group => {
    results[group.category] = {};
    Object.keys(group.instance).forEach(key => {
        results[group.category][key] = {
            ip: group.instance[key],
            last_update: `(${dayjs().format('YYYY/MM/DD HH:mm:ss')})`,
            res: (new Array(16)).map(() => {})
        };
    });
})

const http     = require('http');
const express = require('express');
const IO = require('socket.io');

const app    = express();
const server = http.Server(app);
const io     = IO(server);

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('connection');
    socket.on('disconnect', () => {
        console.log('disconnect');
    });
    socket.emit('init', results);
});

app.use('/logs', express.static(__dirname + '/logs'));
app.use(express.static(__dirname + '/public'));

app.get('/log_list', (req, res) => {
    const files = fs.readdirSync(log_dir);
    const json = [];
    files.reverse();
    for(let f of files) {
        if(/.+\.json$/.test(f)) {
            json.push(f);
        } else if(fs.statSync(path.join(log_dir, f)).isDirectory()) {
            const dir = path.join(log_dir, f);
            const logs = fs.readdirSync(dir);
            for(const ff of logs) {
                json.push(path.join(dir, ff));
            }
        }
    }
    res.json(json);
});

// サーバーの起動
server.listen(PORT, () => {
    console.log('server starts on port: %d', PORT);
});


const cron = require('node-cron');
const ping = require('ping');

cron.schedule(`0 */1 * * *`, () => {
    const date_log_dir = path.join(log_dir, dayjs().format('YYYYMMDD'));
    const file_time = dayjs().format('HHmm');
    if(!fs.existsSync(date_log_dir)) fs.mkdirSync(date_log_dir);
    const saving = logs;
    logs = {};
    const filepath = path.join(date_log_dir, `${file_time}.json`);
    fs.writeFile(filepath, JSON.stringify(saving), () => {
        console.log(`${filepath} was saved`);
    });
});

const current_logs = {};

cron.schedule(`*/${ping_interval} * * * * *`, () => {
    const date = dayjs().format('YYYY/MM/DD HH:mm:ss');
    logs[date] = {};
    const log = logs[date];
    const promises = [];
    list.forEach(group => {
        const category = group.category;
        const instance = group.instance;
        const keys = Object.keys(instance);
        log[category] = {};
        const group_log = log[category];
        keys.forEach(key => {
            const promise = ping.promise
                .probe(instance[key], { timeout: ping_interval - 2.0 })
                .then(resp => {
                    return {
                        alive: resp.alive,
                        resp:  resp.time
                    };
                })
                .catch(err =>{
                    return {
                        alive: false,
                        resp:  null
                    };
                })
                .then(res => {
                    group_log[key] = res.alive ? res.resp : -1;
                    results[category][key].res.pop();
                    results[category][key].res.unshift(res);
                    if(res.alive) results[category][key].last_update = dayjs().format('YYYY/MM/DD HH:mm:ss');
                });
            promises.push(promise);
        })
    });
    Promise
        .all(promises)
        .then(() => {
            io.emit('ping', results);
            current_logs[date] = log;
            const keys = Object.keys(current_logs);
            keys.sort((x, y) => new Date(x).getTime() - new Date(y).getTime());
            if(120 < keys.length) {
                const key = keys.shift();
                delete current_logs[key];
            }
            const filepath = path.join(log_dir, 'current.json');
            fs.writeFile(filepath, JSON.stringify(current_logs, null, '  '), () => {
                console.log(`${filepath} was saved`);
            });
        });
});

