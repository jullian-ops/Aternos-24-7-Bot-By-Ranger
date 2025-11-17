'use strict';
const mc = require('minecraft-protocol');

const HOST = 'TWINKUSSMP.aternos.me';
const PORT = 19348;
const USERNAME = 'Ratgari';
const VERSION = '1.8.9';    //Do Not Change The Version, Install Via Backward Ff You'r Aternos Server Version Is Higher Than 1.8.9

let client = null;
let moveTimer = null;
let gcTimer = null;
const pos = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, onGround: true };
let forward = true;

function cleanup() {
  if (moveTimer) { clearInterval(moveTimer); moveTimer = null; }
  if (gcTimer) { clearInterval(gcTimer); gcTimer = null; }
  if (client) {
    try {
      client.removeAllListeners();
      if (client.socket?.destroy) client.socket.destroy();
      else if (client.end) client.end();
    } catch {}
    client = null;
  }
}

function connect() {
  cleanup();
  client = mc.createClient({ host: HOST, port: PORT, username: USERNAME, version: VERSION, keepAlive: true });

  client.once('position', p => {
    pos.x = Number(p.x) || 0;
    pos.y = Number(p.y) || 0;
    pos.z = Number(p.z) || 0;
    if (moveTimer) clearInterval(moveTimer);
    moveTimer = setInterval(() => {
      pos.z += forward ? 0.25 : -0.25;
      forward = !forward;
      try { client.write('position_look', pos); } catch {}
    }, 100);
  });

  client.on('update_health', h => {
    if (h?.health <= 0) {
      try { client.write('client_command', { actionId: 0 }); } catch {}
    }
  });

  client.on('respawn', () => {
    client.once('position', p => {
      pos.x = Number(p.x) || 0;
      pos.y = Number(p.y) || 0;
      pos.z = Number(p.z) || 0;
    });
  });

  const reconnect = () => { cleanup(); setTimeout(connect, 100); };
  client.on('end', reconnect);
  client.on('error', reconnect);

  gcTimer = setInterval(() => { try { if (global.gc) global.gc(); } catch {} }, 60_000);
}

process.on('uncaughtException', () => { cleanup(); setTimeout(connect, 100); });
connect();

