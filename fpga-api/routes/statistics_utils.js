// Statistics module auxiliary and internal functions

// Package dependencies
var scripts = require('child_process');
var async = require('async');
var path = require('path');
var fs = require('fs');
var config = require('../config.js');
var common = require('./_common.js');


// Module exports

// Constant execs
var checkHugePagesOff = 'cat /proc/meminfo | grep "HugePages_Total:       0"';
exports.checkHugePagesOff = checkHugePagesOff;
var checkInitFPGAOn = 'lspci | grep 19aa:e004';
exports.checkInitFPGAOn = checkInitFPGAOn;
var checkFPGAMountedOn = 'lsmod | grep nfp_driver';
exports.checkFPGAMountedOn = checkFPGAMountedOn;

// Executes the next callback
function nextCallback(res, callbackList) {
  common.logDebug('');
  if (callbackList[0] instanceof Function) {
    callbackList[0](res, callbackList.slice(1));
  }
};
exports.nextCallback = nextCallback;
exports.nextCallback.displayName = common.prettyName(__filename, 'nextCallback');

// HugePages active
function hugePagesOn(res, callbackList) {
  common.logDebug('');
  var status_json = 'status_1_hugepages_off';
  // 0 if huge pages is not active, 1 if hugepages is active
  scripts.exec(checkHugePagesOff).on('exit', function(code) {
    if (code == 0) {
      common.sendJSON(status_json, res, 200);
      return;
    }
    nextCallback(res, callbackList);
  });
};
exports.hugePagesOn = hugePagesOn;
exports.hugePagesOn.displayName = common.prettyName(__filename, 'hugePagesOn');

// FPGA initialized checker
function initializedFPGA(res, callbackList) {
  common.logDebug('');
  var status_json = 'status_2_init_off';
  // 0 if FPGA initialized, 1 otherwise
  scripts.exec(checkInitFPGAOn).on('exit', function(code) {
    if (code != 0) {
      common.sendJSON(status_json, res, 200);
      return;
    }
    nextCallback(res, callbackList);
  });
};
exports.initializedFPGA = initializedFPGA;
exports.initializedFPGA.displayName = common.prettyName(__filename, 'initializedFPGA');

// FPGA mounted checker
function mountedFPGA(res, callbackList) {
  common.logDebug('');
  var status_json = 'status_3_mount_off';
  // 0 if fpga is mounted, 1 otherwise
  scripts.exec(checkFPGAMountedOn).on('exit', function(code) {
    if (code != 0) {
      common.sendJSON(status_json, res, 200);
      return;
    }
    nextCallback(res, callbackList);
  });
};
exports.mountedFPGA = mountedFPGA;
exports.mountedFPGA.displayName = common.prettyName(__filename, 'mountedFPGA');

// Status of the FPGA (after being mounted)
function statusFPGA(res, callbackList) {
  common.logDebug('');
  modeFPGA(5, function(ans) {
    // Set the type (player/recorder)
    if (ans == 'recorder') {
      // Recorder
      runningFPGA(true, function(isRunning) {
        // Running
        if (isRunning) {
          getDataRecording(function(ans) {
            if (ans == 'error') {
              res.sendStatus(500);
            } else {
              res.status(200).json(ans);
            }
          });
        }
        // Not running
        else {
          common.sendJSON('status_4_1_recorder_ready', res, 200);
        }
      });
    }
    // Player
    else if (ans == 'player') {
      runningFPGA(false, function(isRunning) {
        // Running
        if (isRunning) {
          getDataPlaying(function(ans) {
            if (ans == 'error') {
              res.sendStatus(500);
            } else {
              res.status(200).json(ans);
            }
          });
        }
        // Not running
        else {
          common.sendJSON('status_4_1_player_ready', res, 200);
        }
      });
    }
    // FPGA not mounted
    else {
      common.sendJSON('status_3_mount_off', res, 200);
    }
  });
};
exports.statusFPGA = statusFPGA;
exports.statusFPGA.displayName = common.prettyName(__filename, 'statusFPGA');

// Gets the mode of the FPGA (player/recorder/error)
function modeFPGA(tries, callback) {
  common.logDebug('');
  scripts.exec('cat /proc/nfp/nfp_report | tail -n 1', function(error, stdout, stderr) {
    var ans;
    // Set the type (player/recorder)
    if (stdout.indexOf('PLA') != -1) {
      ans = 'player';
    } else if (stdout.indexOf('REC') != -1) {
      ans = 'recorder';
    } else {
      tries--;
      if (tries <= 0) {
        ans = 'error';
      } else {
        setTimeout(function() {
          modeFPGA(tries, callback);
        }, 500);
        return;
      }
    }
    callback(ans);
  });
};
exports.modeFPGA = modeFPGA;
exports.modeFPGA.displayName = common.prettyName(__filename, 'modeFPGA');

// Gets a boolean value that represents if the FPGA is running in a specific mode (true: yes, false: no)
function runningFPGA(recorder, callback) {
  common.logDebug('');
  var command = recorder ? 'pgrep launchRecorder || pgrep card2host' : 'pgrep launchPlayer || pgrep host2card';
  scripts.exec(command).on('exit', function(code) {
    callback(code == 0);
  });
};
exports.runningFPGA = runningFPGA;
exports.runningFPGA.displayName = common.prettyName(__filename, 'runningFPGA');

// Gets a boolean value that represents if the FPGA is running in any mode
function runningAny(callback) {
  common.logDebug('');
  var command = 'pgrep launchRecorder || pgrep card2host || pgrep launchPlayer || pgrep host2card';
  scripts.exec(command).on('exit', function(code) {
    callback(code == 0);
  });
};
exports.runningAny = runningAny;
exports.runningAny.displayName = common.prettyName(__filename, 'runningAny');

// Gets the current recording info
function getDataRecording(callback) {
  common.logDebug('');
  common.readJSON('status_4_2_recording', function(ans) {
    scripts.exec('ps -eo etime,command | grep launchRecorder.sh | grep -v grep | head -n 1', function(error, stdout, stderr) {
      if (error) {
        // Internal error
        common.logError(stderr);
        callback('error');
        return;
      }
      // Output format:
      //    [etime] sudo -b nohup ./bin/launchRecorder.sh port bytes simple
      var parts = stdout.match(/\S+/g);
      if ((parts != null) && (parts.length >= 8)) {
        ans.elapsed_time = common.etime2seconds(parts[0]);
        ans.bytes_total = parseInt(parts[6]);
        // Add the extension part
        var extension = parts[6].slice(-1).toUpperCase();
        if (extension == 'G') {
          ans.bytes_total *= 1024 * 1024 * 1024;
        } else if (extension == 'M') {
          ans.bytes_total *= 1024 * 1024;
        } else if (extension == 'K') {
          ans.bytes_total *= 1024;
        }
        ans.port = parseInt(parts[5]);
        var capturePath = parts.slice(7).join(' ');
        ans.capture = path.basename(capturePath);
        fs.stat(capturePath, function(err, captureStats) {
          if (!err) {
            ans.bytes_captured = captureStats['size'];
          }
          callback(ans);
        });
      }
    });
  });
};
exports.getDataRecording = getDataRecording;
exports.getDataRecording.displayName = common.prettyName(__filename, 'getDataRecording');

// Gets the current playing info
function getDataPlaying(callback) {
  common.logDebug('');
  common.readJSON('status_4_2_playing', function(ans) {
    scripts.exec('ps -eo etime,command | grep launchPlayer.sh | grep -v grep | head -n 1', function(error, stdout, stderr) {
      if (error) {
        // Internal error
        common.logError(stderr);
        callback('error');
        return;
      }
      // Output format:
      //    [etime] sudo -b nohup ./bin/launchRecorder.sh mask ifg loop simple_file
      var parts = stdout.match(/\S+/g);
      if ((parts != null) && (parts.length >= 9)) {
        ans.elapsed_time = common.etime2seconds(parts[0]);
        ans.mask = parseInt(parts[5]);
        ans.interframe_gap = parseInt(parts[6]);
        ans.loop = (parts[7] == '1');
        var capturePath = parts.slice(8).join(' ');
        ans.capture = path.basename(capturePath);
        fs.stat(capturePath, function(err, captureStats) {
          if (!err) {
            ans.size = captureStats['size'];
            ans.date = common.mtime2string(captureStats['mtime']);
          }
          ans.packets_sent = 0;
          scripts.exec('sudo ./bin/readRegisters 2>&1 | grep "total packets" | awk \'{print $5}\'', function(error, stdout, stderr) {
            console.log(stdout);
            console.log('----');
            console.log(stderr);
            if (stdout.length > 0) {
              ans.packets_sent = parseInt(stdout);
            }
            callback(ans);
          });
        });
      }
    });
  });
};
exports.getDataPlaying = getDataPlaying;
exports.getDataPlaying.displayName = common.prettyName(__filename, 'getDataPlaying');

// Get raid statistics
function getRaidStats(res, ans) {
  common.logDebug('');
  var command = 'dd if="' + config.RAID_DEV + '" of=/dev/null bs=16MB  count=256  iflag=direct 2>&1 | tail -n1 | awk \'{print int($1/($6+1))}\'';
  scripts.exec(command, function(error, stdout, stderr) {
    if (error) {
      // Internal error
      common.logError(stderr);
      res.sendStatus(500);
      return;
    }
    ans.raid_stats.write_speed = parseInt(stdout);
    ans.raid_stats.raid_name = config.RAID_DEV;
    // Individual stats
    async.map(config.RAID_DISKS,
      function(disk, callback) {
        var diskStats = {};
        var diskCommand = 'dd if="' + disk + '" of=/dev/null bs=8MB  count=256  iflag=direct 2>&1 | tail -n1 | awk \'{print int($1/($6+1))}\'';
        diskStats['name'] = disk;
        // Write speed
        scripts.exec(diskCommand, function(error, stdout, stderr) {
          if (error) {
            callback('error', diskStats);
          } else {
            diskStats['write_speed'] = parseInt(stdout);
            callback(null, diskStats);
          }
        });
      },
      function(err, results) {
        if (err) {
          res.sendStatus(500);
          return;
        }
        ans.raid_stats.disks = results;
        res.status(200).json(ans);
      });
  });
};
exports.getRaidStats = getRaidStats;
exports.getRaidStats.displayName = common.prettyName(__filename, 'getRaidStats');
