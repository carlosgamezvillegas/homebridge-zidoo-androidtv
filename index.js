"use strict";
const PLATFORM_NAME = 'zidooPlugin';
const PLUGIN_NAME = 'homebridge-zidoo-androidtv';
const WOL = require('wol');
const request = require('http');
const udp = require('dgram');

module.exports = (api) => {
    api.registerPlatform(PLATFORM_NAME, zidooPlatform);
};
//// Platform/////////////////////////////////////////////////////////////////////////////////////////////////
class zidooPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.config.name = this.config.name || 'Zidoo AndroidTV';
        this.config.newPlatformUUID = this.config.newPlatformUUID || false;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.log.debug('Finished initializing platform:', this.config.name);
        this.api.on('didFinishLaunching', () => {
            log.debug('didFinishLaunching callback');
            this.iniDevice();
        });
    }
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }
    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    iniDevice() {
        if (this.config.newPlatformUUID === false) {
            this.zidooDevice =
            {
                zidooUniqueId: 'nicocate',
                zidooDisplayName: `${this.config.name}`
            };
        }
        if (this.config.newPlatformUUID === true) {
            this.zidooDevice =
            {
                zidooUniqueId: `${this.config.name}catanico`,
                zidooDisplayName: `${this.config.name}`
            };
            this.log.debug('Generationg a new UUID');
        }
        const uuid = this.api.hap.uuid.generate(this.zidooDevice.zidooUniqueId);
        this.log.debug('Adding new accessory:', this.zidooDevice.zidooDisplayName);
        const accessory = new this.api.platformAccessory(this.zidooDevice.zidooDisplayName, uuid);
        accessory.category = this.api.hap.Accessory.Categories.TV_SET_TOP_BOX;
        accessory.context.device = this.zidooDevice;
        new zidooAccessory(this, accessory);
        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    }
}
class zidooAccessory {
    constructor(platform, accessory) {

        this.platform = platform;
        this.accessory = accessory;
        this.config = platform.config;
        this.ZIDOO_IP = this.config.ip;
        this.ZIDOO_PORT = 9529;
        this.ZIDOO_UDP_PORT = 18239;
        this.statelessTimeOut = 1000;
        this.turnOffCommand = false;
        this.moviePlaying = false;
        this.musicPlaying = false;
        //////Initial Switch and sensors state///////////////////////////////////////////////////////////////////////////////////////////////
        this.powerState = false;
        this.playBackState = [false, false, false];
        this.inputState = [false, false, false, false, false, false];
        this.powerStateTV = 0;
        this.currentVolume = 0;
        this.currentMuteState = false;
        this.currentVolumeSwitch = false;
        this.maxVolume = 15;
        this.inputID = 1;
        this.mediaState = 4;
        this.videoState = false;
        this.audioState = false;
        this.inputName = 'Media Title';
        this.mediaDuration = 'Runtime';
        this.subtitleInfo = 'Additional Information';
        this.mediaVideoFormat = 'Video Information';
        this.mediaAudioFormat = 'Audio Information';
        this.language = 'Audio Language';
        this.IPReceived = false;
        this.macReceived = false;
        this.showState = false;
        this.httpNotResponding = 0;
        /////MovieConstants
        this.currentMovieProgress = 0;
        this.currentMovieProgressState = false;
        this.movieElapsed = 0;
        this.movieRemaining = 0;
        ////Connection parameters
        this.reconnectionTry = 15;
        //Device Information//////////////////////////////////////////////////////////////////////////////////////
        this.config.name = platform.config.name || 'Zidoo Z9X';
        this.config.manufacturer = platform.config.manufacturer || 'Zidoo';
        this.config.pollingInterval = platform.config.pollingInterval || 1000;
        this.config.modelName = platform.config.modelName || 'Z9X';
        this.config.serialN = platform.config.serialN || 'B210U71647033894';
        this.config.mac = platform.config.mac || 'CA:TA:NI:CO:GA:TA';
        this.config.autoIPMac = platform.config.autoIPMac || false;
        this.config.standby = platform.config.standby || true;
        this.config.mediaButtons = platform.config.mediaButtons || false;
        this.config.cursorUpB = platform.config.cursorUpB || false;
        this.config.cursorDownB = platform.config.cursorDownB || false;
        this.config.cursorLeftB = platform.config.cursorLeftB || false;
        this.config.cursorRightB = platform.config.cursorRightB || false;
        this.config.cursorEnterB = platform.config.cursorEnterB || false;
        this.config.menuB = platform.config.menuB || false;
        this.config.backButtonB = platform.config.backButtonB || false;
        this.config.homeMenuB = platform.config.homeMenuB || false;
        this.config.infoB = platform.config.infoB || false;
        this.config.pageUpB = platform.config.pageUpB || false;
        this.config.pageDownB = platform.config.pageDownB || false;
        this.config.popUpMenuB = platform.config.popUpMenuB || false;
        this.config.redB = platform.config.redB || false;
        this.config.yellowB = platform.config.yellowB || false;
        this.config.blueB = platform.config.blueB || false;
        this.config.audioB = platform.config.audioB || false;
        this.config.greenB = platform.config.greenB || false;
        this.config.subtitleB = platform.config.subtitleB || false;
        this.config.repeatB = platform.config.repeatB || false;
        this.config.pipB = platform.config.pipB || false;
        this.config.resolutionB = platform.config.resolutionB || false;
        this.config.movieControl = platform.config.movieControl || false;
        this.config.powerB = platform.config.powerB || false;
        this.config.muteB = platform.config.muteB || false;
        this.config.recordB = platform.config.recordB || false;
        this.config.movieB = platform.config.movieB || false;
        this.config.musicB = platform.config.musicB || false;
        this.config.photoB = platform.config.photoB || false;
        this.config.fileB = platform.config.fileB || false;
        this.config.lightB = platform.config.lightB || false;
        this.config.screenshotB = platform.config.screenshotB || false;
        this.config.appSwitchB = platform.config.appSwitchB || false;
        this.config.rebootB = platform.config.rebootB || false;
        this.config.changeDimmersToFan = platform.config.changeDimmersToFan || false;
        this.config.remainMovieTimer = platform.config.remainMovieTimer || false;
        this.config.volume = platform.config.volume || false;
        this.config.infoToMenu = platform.config.infoToMenu || false;
        this.config.removePlayback = platform.config.removePlayback || false;
        if (this.config.autoIPMac === true) {
            //this.platform.log('set to false');
            this.config.autoIPMac = false;
        }
        else {
            // this.platform.log('set to true');
            this.config.autoIPMac = true;
        }
        ////Checking if the necessary information was given by the user////////////////////////////////////////////////////
        try {
            if (!this.config.ip && this.config.autoIPMac === false) {
                throw new Error(`Zidoo IP address is required for ${this.config.name}`);
            }
        } catch (error) {
            this.platform.log(error);
            this.platform.log('Failed to create platform device, missing mandatory information!');
            this.platform.log('Please check your device config!');
            return;
        }

        ////////////Get Model/////////////////////

        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.config.manufacturer)
            .setCharacteristic(this.platform.Characteristic.Model, this.config.modelName)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.config.serialN);
        // set accessory information//////////////////////////////////////////////////////////////////////////////////////////
        /////////Television Controls///////////////////////////////////////////////////////////////////////////////////////////
        // add the tv service
        this.tvService = this.accessory.getService(this.config.name) ||
            this.accessory.addService(this.platform.Service.Television, this.config.name, 'CataNicoGaTa-7');
        this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.config.name);
        this.tvService.setCharacteristic(this.platform
            .Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(this.platform.Characteristic.Active)
            .on('get', (callback) => {
                callback(null, this.powerStateTV);
            })
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Set Zidoo Active to: ' + newValue);
                if (newValue === 1) {
                    this.newPowerState(true);
                    this.turnOnCommand = true;
                    this.turnOffCommand = false;
                    this.WakeupOnLAN();
                    // this.sending([this.pressedButton('POWER ON')]);
                }
                else {
                    if (this.playBackState[0] === true || this.playBackState[1] === true) {
                        this.sending([this.pressedButton('STOP')]);
                        this.newPowerState(false);
                        this.turnOffCommand = true;
                        this.turnOnCommand = false;
                        this.turnOffAll();
                        setTimeout(() => {
                            this.sending([this.pressedButton('POWER OFF')]);
                        }, 100);
                    }
                    else {
                        this.newPowerState(false);
                        this.turnOffCommand = true;
                        this.turnOnCommand = false;
                        this.turnOffAll();
                        this.sending([this.pressedButton('POWER OFF')]);
                    }
                }
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.ClosedCaptions)
            .on('get', (callback) => {
                this.platform.log.debug('Subtitle GET On');
                let currentValue = 0;
                callback(null, currentValue);
            })
            .on('set', (value, callback) => {
                this.platform.log.debug('Subtitle SET On:', value);
                if (value === 1) {
                    this.sending([this.pressedButton('SUBTITLE')]);
                }
                this.tvService.updateCharacteristic(this.platform.Characteristic.ClosedCaptions, 0);
                callback(null);
            });
        ///Things to remove
        this.tvService.getCharacteristic(this.platform.Characteristic.Brightness)
            .on('get', (callback) => {
                let currentValue = this.currentVolume;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.sending([this.volumeChange(newValue)]);
                this.platform.log.debug('Volume Value set to: ' + newValue);
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.PictureMode)
            .on('set', (newValue, callback) => {
                if (newValue === 1) {
                    this.sending([this.pressedButton('VOLUME DOWN')]);
                }
                if (newValue === 0) {
                    this.sending([this.pressedButton('VOLUME UP')]);
                }
                this.platform.log('Volume Value moved by: ' + newValue);
                callback(null);
            });
        /////
        this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', (newValue, callback) => {
                switch (newValue) {
                    case this.platform.Characteristic.RemoteKey.REWIND: {
                        this.platform.log.debug('set Remote Key Pressed: REWIND');
                        this.sending([this.pressedButton('REWIND')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
                        this.platform.log.debug('set Remote Key Pressed: FAST_FORWARD');
                        this.sending([this.pressedButton('FORWARD')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
                        this.platform.log.debug('set Remote Key Pressed: NEXT_TRACK');
                        this.sending([this.pressedButton('NEXT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
                        this.platform.log.debug('set Remote Key Pressed: PREVIOUS_TRACK');
                        this.sending([this.pressedButton('PREVIOUS')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_UP: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_UP');
                        this.sending([this.pressedButton('CURSOR UP')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_DOWN');
                        this.sending([this.pressedButton('CURSOR DOWN')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_LEFT');
                        this.sending([this.pressedButton('CURSOR LEFT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_RIGHT');
                        this.sending([this.pressedButton('CURSOR RIGHT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.SELECT: {
                        this.platform.log.debug('set Remote Key Pressed: SELECT');
                        this.sending([this.pressedButton('CURSOR ENTER')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.BACK: {
                        this.platform.log.debug('set Remote Key Pressed: BACK');
                        this.sending([this.pressedButton('BACK')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.EXIT: {
                        this.platform.log.debug('set Remote Key Pressed: EXIT');
                        this.sending([this.pressedButton('HOME MENU')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
                        this.platform.log.debug('set Remote Key Pressed: PLAY_PAUSE');
                        this.sending([this.pressedButton('PLAY/PAUSE')]);

                        /*  if (this.playBackState[0] === false) {
                              this.sending([this.pressedButton('PLAY')]);
                          }
                          else {
                              this.sending([this.pressedButton('PAUSE')]);
                          }
                          */
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.INFORMATION: {
                        if (this.config.infoToMenu) {
                            this.platform.log.debug('set Remote Key Pressed: MENU');
                            this.sending([this.pressedButton('MENU')]);
                        }
                        else {
                            this.platform.log.debug('set Remote Key Pressed: INFORMATION');
                            this.sending([this.pressedButton('INFO')]);
                        }
                        break;
                    }
                }
                callback(null);
            });
        //////////////////////////////////TV Service//////////////////////////////////////////////////////////////////////////
        this.tvService
            .setCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        this.tvService
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', (inputIdentifier, callback) => {
                this.platform.log.debug('Active Identifier set to:', inputIdentifier);
                this.inputID = inputIdentifier;
                callback();
            })
            .on('get', (callback) => {
                let currentValue = this.inputID;
                this.platform.log.debug('Active Identifier set to:', currentValue);
                callback(null, currentValue);
            });
        this.tvService
            .getCharacteristic(this.platform.Characteristic.PowerModeSelection)
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Requested Zidoo Settings ' + newValue);
                if (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false) {
                    this.sending([this.pressedButton('MENU')]);
                }
                else {
                    this.sending([this.pressedButton('MENU')]);
                }
                callback();
            });
        // Input Sources///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.videoAudioTitle = this.accessory.getService('Media Title') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Media Title', 'CataNicoGaTa-1003')
                .setCharacteristic(this.platform.Characteristic.Identifier, 1)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.APPLICATION)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.inputName;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoAudioTitle);
        this.runtime = this.accessory.getService('Runtime') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Runtime', 'CataNicoGaTa-1004')
                .setCharacteristic(this.platform.Characteristic.Identifier, 2)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaDuration;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.runtime);
        this.videoAudioElapseTime = this.accessory.getService('Elapsed Time') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Additional Information', 'CataNicoGaTa-1005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 6)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.subtitleInfo)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, false ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, false ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.subtitleInfo;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoAudioElapseTime);
        this.videoFormat = this.accessory.getService('Video Format') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Video Information', 'CataNicoGaTa-4005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 3)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaVideoFormat;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoFormat);
        this.audioFormat = this.accessory.getService('Audio Format') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Audio Information', 'CataNicoGaTa-4006')
                .setCharacteristic(this.platform.Characteristic.Identifier, 4)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaAudioFormat;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.audioFormat);
        this.audioLanguage = this.accessory.getService('Audio Language') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Audio Language', 'CataNicoGaTa-4007')
                .setCharacteristic(this.platform.Characteristic.Identifier, 5)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.language)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.language;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.audioLanguage);
        /////Media State/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
            .on('get', (callback) => {
                let currentValue = this.mediaState;
                this.platform.log.debug('Current Playback State', currentValue);
                callback(null, currentValue);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.TargetMediaState)
            .on('get', (callback) => {
                let currentValue = this.mediaState;
                if (this.mediaState === 4) {
                    currentValue = 2;
                }
                this.platform.log.debug('Current Playback State', currentValue);
                callback(null, currentValue);
            })
            .on('set', (value, callback) => {
                if (value === 0) {
                    this.sending([this.pressedButton('PLAY')]);
                }
                else if (value === 1) {
                    this.sending([this.pressedButton('PAUSE')]);
                }
                else if (value === 2) {
                    this.sending([this.pressedButton('STOP')]);
                }
                this.platform.log.debug('Playback State set to:', value);
                callback(null);
            });
        ////////Volume services for the Zidoo/////////////////////////////////////////////////////////////////////////////////
        this.speakerService = this.accessory.getService('Zidoo Volume Control') ||
            this.accessory.addService(this.platform.Service.TelevisionSpeaker, 'Zidoo Volume Control', 'CataNicoGaTa-20');
        this.speakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        this.speakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .on('set', (newValue, callback) => {
                if (newValue === 1) {
                    this.sending([this.pressedButton('VOLUME DOWN')]);
                }
                if (newValue === 0) {
                    this.sending([this.pressedButton('VOLUME UP')]);
                }
                this.platform.log('Volume Value moved by: ' + newValue);
                callback(null);
            });
        this.speakerService.getCharacteristic(this.platform.Characteristic.Mute)
            .on('get', (callback) => {
                let currentValue = this.currentMuteState;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Volume Value set to: Mute/Unmute');
                this.sending([this.pressedButton('MUTE')]);
                if (this.currentMuteState === false) {
                    this.currentMuteState = true
                }
                if (this.currentMuteState === true) {
                    this.currentMuteState = false
                }
                callback(null);
            });
        this.speakerService.addCharacteristic(this.platform.Characteristic.Volume)
            .on('get', (callback) => {
                let currentValue = this.currentVolume;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.sending([this.volumeChange(newValue)]);
                this.platform.log.debug('Volume Value set to: ' + newValue);
                callback(null);
            });
        this.tvService.addLinkedService(this.speakerService);
        /////Volume and Video/Movie Controls/////////////////////////////////////////////////////////////////////

        if (this.config.volume === true) {
            if (this.config.changeDimmersToFan === false) {
                this.volumeDimmer = this.accessory.getService('Zidoo Volume') ||
                    this.accessory.addService(this.platform.Service.Lightbulb, 'Zidoo Volume', 'CataNicoGaT-98Z');
                this.volumeDimmer.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
                this.volumeDimmer.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Zidoo Volume');
                this.volumeDimmer.getCharacteristic(this.platform.Characteristic.On)
                    .on('get', (callback) => {
                        let currentValue = this.currentVolumeSwitch;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        this.platform.log.debug('Volume Value set to: Mute/Unmute');
                        if (newValue == false) {
                            if (this.currentVolume != 0) {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + '0']);
                            }
                        }
                        else {
                            if (this.currentVolume == 0) {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + this.maxVolume]);
                            }
                            else {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + this.currentVolume]);
                            }
                        }
                        callback(null);
                    });

                this.volumeDimmer.addCharacteristic(new this.platform.Characteristic.Brightness())
                    .on('get', (callback) => {
                        let currentValue = this.currentVolume;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        let newVolumeValue = Math.round(Math.min(Math.max((this.maxVolume * newValue) / 100, 0), this.maxVolume));
                        this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + newVolumeValue]);
                        this.platform.log('Volume Value set to: ' + newValue) + "%";
                        callback(null);
                    });
            }
            else {
                this.volumeFan = this.accessory.getService('Zidoo Volume') ||
                    this.accessory.addService(this.platform.Service.Fanv2, 'Zidoo Volume', 'CataNicoGaT-98FZ');
                this.volumeFan.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
                this.volumeFan.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Zidoo Volume');
                this.volumeFan.getCharacteristic(this.platform.Characteristic.Active)
                    .on('get', (callback) => {
                        let currentValue = 0;
                        if (this.currentVolumeSwitch === true) {
                            currentValue = 1;
                        }
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        if (newValue == 0) {
                            if (this.currentVolume != 0) {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + '0']);
                            }
                        }
                        else {
                            if (this.currentVolume == 0) {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + this.maxVolume]);
                            }
                            else {
                                this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + this.currentVolume]);
                            }
                        }
                        callback(null);
                    });

                this.volumeFan.addCharacteristic(new this.platform.Characteristic.RotationSpeed)
                    .on('get', (callback) => {
                        let currentValue = this.currentVolume;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        let newVolumeValue = Math.round(Math.min(Math.max((this.maxVolume * newValue) / 100, 0), this.maxVolume));
                        this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + newVolumeValue]);
                        this.platform.log('Volume Value set to: ' + newValue + "%");

                        callback(null);
                    });
            }
        }
        if (this.config.movieControl === true) {
            if (this.config.changeDimmersToFan === false) {
                this.movieControlL = this.accessory.getService('Media Progress') ||
                    this.accessory.addService(this.platform.Service.Lightbulb, 'Media Progress', 'CataNicoGaTa-301');
                this.movieControlL.setCharacteristic(this.platform.Characteristic.Name, 'Media Progress');
                this.movieControlL.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
                this.movieControlL.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Media Progress');
                this.movieControlL.getCharacteristic(this.platform.Characteristic.On)
                    .on('get', (callback) => {
                        let currentValue = this.currentMovieProgressState;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        this.platform.log('Movie progress state set to: ' + newValue);
                        callback(null);
                    });
                this.movieControlL.addCharacteristic(new this.platform.Characteristic.Brightness())
                    .on('get', (callback) => {
                        let currentValue = this.currentMovieProgress;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        let newSendValue = Math.round(newValue * (this.movieRemaining) * 10);
                        let totalMovieTime = this.movieRemaining * 1000;
                        if (newSendValue > totalMovieTime) { newSendValue = totalMovieTime; }
                        if (this.musicPlaying === true) {
                            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooMusicControl/v2/seekTo?time=" + newSendValue]);
                        }
                        else {
                            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooVideoPlay/seekTo?positon=" + newSendValue]);
                        }
                        this.newMovieTime(newSendValue);
                        this.platform.log('Movie progress set to: ' + newValue + '%');
                        callback(null);
                    });
            }
            else {
                this.movieControlF = this.accessory.getService('Media Progress') ||
                    this.accessory.addService(this.platform.Service.Fanv2, 'Media Progress', 'CataNicoGaTa-301F');
                this.movieControlF.setCharacteristic(this.platform.Characteristic.Name, 'Media Progress');
                this.movieControlF.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
                this.movieControlF.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Media Progress');
                this.movieControlF.getCharacteristic(this.platform.Characteristic.Active)
                    .on('get', (callback) => {
                        let currentValue = 0;
                        if (this.currentMovieProgressState) {
                            currentValue = 1
                        }
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        this.platform.log('Movie progress state set to: ' + newValue);
                        callback(null);
                    });
                this.movieControlF.addCharacteristic(new this.platform.Characteristic.RotationSpeed)
                    .on('get', (callback) => {
                        let currentValue = this.currentMovieProgress;
                        callback(null, currentValue);
                    })
                    .on('set', (newValue, callback) => {
                        let newSendValue = Math.round(newValue * (this.movieRemaining) * 10);
                        let totalMovieTime = this.movieRemaining * 1000;
                        if (newSendValue > totalMovieTime) { newSendValue = totalMovieTime; }
                        if (this.musicPlaying === true) {
                            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooMusicControl/v2/seekTo?time=" + newSendValue]);
                        }
                        else {
                            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooVideoPlay/seekTo?positon=" + newSendValue]);
                        }
                        this.newMovieTime(newSendValue);
                        this.platform.log('Movie progress set to: ' + newValue + '%');
                        callback(null);
                    });
            }
        }
        /////////////Addtional Services////////////////////////////////////////////////////////////////////////////////////

        if (this.config.powerB === true) {
            this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
            this.service.setCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.zidooDisplayName} Power Switch`);
            this.service.updateCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.zidooDisplayName} Power Switch`);
            this.service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.service.setCharacteristic(this.platform.Characteristic.ConfiguredName, `${accessory.context.device.zidooDisplayName} Power Switch`);
            this.service.getCharacteristic(this.platform.Characteristic.On)
                .on('set', this.setOn.bind(this))
                .on('get', this.getOn.bind(this));
        };
        if (!this.config.removePlayback) {
            this.play = this.accessory.getService('Play') ||
                this.accessory.addService(this.platform.Service.Switch, 'Play', 'CataNicoGaTa-10');
            // this.ensureName(this.platform, this.play, 'Play')
            this.play.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.play.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Play');
            this.play.getCharacteristic(this.platform.Characteristic.On)
                .on('get', this.playSwitchStateGet.bind(this))
                .on('set', this.playSwitchStateSet.bind(this));
            this.pause = this.accessory.getService('Pause') ||
                this.accessory.addService(this.platform.Service.Switch, 'Pause', 'CataNicoGaTa-11');
            this.pause.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.pause.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Pause');
            this.pause.getCharacteristic(this.platform.Characteristic.On)
                .on('get', this.pauseSwitchStateGet.bind(this))
                .on('set', this.pauseSwitchStateSet.bind(this));
            this.stop = this.accessory.getService('Stop') ||
                this.accessory.addService(this.platform.Service.Switch, 'Stop', 'CataNicoGaTa-12');
            this.stop.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.stop.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Stop');
            this.stop.getCharacteristic(this.platform.Characteristic.On)
                .on('get', this.stopSwitchStateGet.bind(this))
                .on('set', this.stopSwitchStateSet.bind(this));
        }
        ///////////////////////////////////Input buttons//////////////////////////////////////////////////////////////////////////

        ////other Controls /////////////////////////////////////////////////////////
        if (this.config.cursorUpB === true) {
            this.cursorUp = this.accessory.getService('Cursor Up') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Up', 'CataNicoGaTa-31');
            this.cursorUp.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.cursorUp.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cursor Up');
            this.cursorUp.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Up GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Up SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR UP')]);
                    }
                    setTimeout(() => {
                        this.cursorUp.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorDownB === true) {
            this.cursorDown = this.accessory.getService('Cursor Down') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Down', 'CataNicoGaTa-32');
            this.cursorDown.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.cursorDown.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cursor Down');
            this.cursorDown.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Down GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Down SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR DOWN')]);
                    }
                    setTimeout(() => {
                        this.cursorDown.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorLeftB === true) {
            this.cursorLeft = this.accessory.getService('Cursor Left') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Left', 'CataNicoGaTa-33');
            this.cursorLeft.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.cursorLeft.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cursor Left');
            this.cursorLeft.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Left GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Left SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR LEFT')]);
                    }
                    setTimeout(() => {
                        this.cursorLeft.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorRightB === true) {
            this.cursorRight = this.accessory.getService('Cursor Right') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Right', 'CataNicoGaTa-34');
            this.cursorRight.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.cursorRight.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cursor Right');
            this.cursorRight.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Right GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Right SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR RIGHT')]);
                    }
                    setTimeout(() => {
                        this.cursorRight.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorEnterB === true) {
            this.cursorEnter = this.accessory.getService('Cursor Enter') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Enter', 'CataNicoGaTa-35');
            this.cursorEnter.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.cursorEnter.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cursor Enter');
            this.cursorEnter.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Enter GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Enter SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR ENTER')]);
                    }
                    setTimeout(() => {
                        this.cursorEnter.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.menuB === true) {
            this.menu = this.accessory.getService('Menu') ||
                this.accessory.addService(this.platform.Service.Switch, 'Menu', 'CataNicoGaTa-36');
            this.menu.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.menu.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Menu');
            this.menu.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Menu GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Menu SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MENU')]);
                    }
                    setTimeout(() => {
                        this.menu.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.backButtonB === true) {
            this.backButton = this.accessory.getService('Back') ||
                this.accessory.addService(this.platform.Service.Switch, 'Back', 'CataNicoGaTa-37');
            this.backButton.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.backButton.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Back');
            this.backButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Back GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Back SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('BACK')]);
                    }
                    setTimeout(() => {
                        this.backButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.homeMenuB === true) {
            this.homeMenu = this.accessory.getService('Home Menu') ||
                this.accessory.addService(this.platform.Service.Switch, 'Home Menu', 'CataNicoGaTa-43');
            this.homeMenu.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.homeMenu.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Home Menu');
            this.homeMenu.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Home Menu GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Home Menu SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('HOME MENU')]);
                    }
                    setTimeout(() => {
                        this.homeMenu.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.infoB === true) {
            this.infoButton = this.accessory.getService('Info') ||
                this.accessory.addService(this.platform.Service.Switch, 'Info', 'CataNicoGaTa-44');
            this.infoButton.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.infoButton.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Info');
            this.infoButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Info GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Info SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('INFO')]);
                    }
                    setTimeout(() => {
                        this.infoButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pageUpB === true) {
            this.pageUp = this.accessory.getService('Page Up') ||
                this.accessory.addService(this.platform.Service.Switch, 'Page Up', 'CataNicoGaTa-50');
            this.pageUp.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.pageUp.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Page Up');
            this.pageUp.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Page Up GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Page Up SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PAGE UP')]);
                    }
                    setTimeout(() => {
                        this.pageUp.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pageDownB === true) {
            this.pageDown = this.accessory.getService('Page Down') ||
                this.accessory.addService(this.platform.Service.Switch, 'Page Down', 'CataNicoGaTa-51');
            this.pageDown.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.pageDown.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Page Down');
            this.pageDown.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Page Down GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Page Down SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PAGE DOWN')]);
                    }
                    setTimeout(() => {
                        this.pageDown.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.popUpMenuB === true) {
            this.popUpMenu = this.accessory.getService('Pop-Up Menu') ||
                this.accessory.addService(this.platform.Service.Switch, 'Pop-Up Menu', 'CataNicoGaTa-52');
            this.popUpMenu.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.popUpMenu.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Pop-Up Menu');
            this.popUpMenu.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Pop-Up Menu GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Pop-Up Menu SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('POP-UP MENU')]);
                    }
                    setTimeout(() => {
                        this.popUpMenu.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        //////Additional Media Buttons/////////////////////////////////////////////////
        if (this.config.mediaButtons === true) {
            this.previous = this.accessory.getService('Previous') ||
                this.accessory.addService(this.platform.Service.Switch, 'Previous', 'CataNicoGaTa-38');
            this.previous.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.previous.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Previous');
            this.previous.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Previous GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Previous SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PREVIOUS')]);
                    }
                    setTimeout(() => {
                        this.previous.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.next = this.accessory.getService('Next') ||
                this.accessory.addService(this.platform.Service.Switch, 'Next', 'CataNicoGaTa-39');
            this.next.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.next.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Next');
            this.next.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Next GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Next SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('NEXT')]);
                    }
                    setTimeout(() => {
                        this.next.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.rewindButton = this.accessory.getService('Rewind') ||
                this.accessory.addService(this.platform.Service.Switch, 'Rewind', 'CataNicoGaTa-46');
            this.rewindButton.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.rewindButton.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Rewind');
            this.rewindButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Rewind GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Rewind SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('REWIND')]);
                    }
                    setTimeout(() => {
                        this.rewindButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.forwardButton = this.accessory.getService('Forward') ||
                this.accessory.addService(this.platform.Service.Switch, 'Forward', 'CataNicoGaTa-80');
            this.forwardButton.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.forwardButton.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Forward');
            this.forwardButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Forward GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Forward SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('FORWARD')]);
                    }
                    setTimeout(() => {
                        this.forwardButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        /////The rest of the buttons///////////////////////////////////////////////////////////////////
        if (this.config.redB === true) {
            this.red = this.accessory.getService('Red') ||
                this.accessory.addService(this.platform.Service.Switch, 'Red', 'CataNicoGaTa-53');
            this.red.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.red.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Red');
            this.red.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Red GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Red SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RED')]);
                    }
                    setTimeout(() => {
                        this.red.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.greenB === true) {
            this.green = this.accessory.getService('Green') ||
                this.accessory.addService(this.platform.Service.Switch, 'Green', 'CataNicoGaTa-54');
            this.green.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.green.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Green');
            this.green.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Green GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Green SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('GREEN')]);
                    }
                    setTimeout(() => {
                        this.green.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.blueB === true) {
            this.blue = this.accessory.getService('Blue') ||
                this.accessory.addService(this.platform.Service.Switch, 'Blue', 'CataNicoGaTa-55');
            this.blue.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.blue.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Blue');
            this.blue.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Blue GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Blue SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('BLUE')]);
                    }
                    setTimeout(() => {
                        this.blue.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.yellowB === true) {
            this.yellow = this.accessory.getService('Yellow') ||
                this.accessory.addService(this.platform.Service.Switch, 'Yellow', 'CataNicoGaTa-56');
            this.yellow.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.yellow.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Yellow');
            this.yellow.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Yellow GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Yellow SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('YELLOW')]);
                    }
                    setTimeout(() => {
                        this.yellow.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.audioB === true) {
            this.audio = this.accessory.getService('Audio') ||
                this.accessory.addService(this.platform.Service.Switch, 'Audio', 'CataNicoGaTa-57');
            this.audio.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.audio.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Audio');
            this.audio.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Audio GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Audio SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('AUDIO')]);
                    }
                    setTimeout(() => {
                        this.audio.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.subtitleB === true) {
            this.subtitle = this.accessory.getService('Subtitle') ||
                this.accessory.addService(this.platform.Service.Switch, 'Subtitle', 'CataNicoGaTa-58');
            this.subtitle.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.subtitle.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Subtitle');
            this.subtitle.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Subtitle GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Subtitle SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SUBTITLE')]);
                    }
                    setTimeout(() => {
                        this.subtitle.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.repeatB === true) {
            this.repeat = this.accessory.getService('Repeat') ||
                this.accessory.addService(this.platform.Service.Switch, 'Repeat', 'CataNicoGaTa-63');
            this.repeat.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.repeat.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Repeat');
            this.repeat.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Repeat GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Repeat SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('REPEAT')]);
                    }
                    setTimeout(() => {
                        this.repeat.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pipB === true) {

            this.pip = this.accessory.getService('PIP') ||
                this.accessory.addService(this.platform.Service.Switch, 'PIP', 'CataNicoGaTa-64');
            this.pip.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.pip.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'PIP');
            this.pip.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('PIP GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('PIP SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PIP')]);
                    }
                    setTimeout(() => {
                        this.pip.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.resolutionB === true) {
            this.resolution = this.accessory.getService('Resolution') ||
                this.accessory.addService(this.platform.Service.Switch, 'Resolution', 'CataNicoGaTa-65');
            this.resolution.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.resolution.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Resolution');
            this.resolution.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Resolution GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Resolution SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RESOLUTION')]);
                    }
                    setTimeout(() => {
                        this.resolution.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }

        if (this.config.muteB === true) {
            this.mute = this.accessory.getService('Mute') ||
                this.accessory.addService(this.platform.Service.Switch, 'Mute', 'CataNicoGaTa-9001');
            this.mute.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.mute.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Mute');
            this.mute.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Mute GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Mute SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MUTE')]);
                    }
                    setTimeout(() => {
                        this.mute.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.recordB === true) {
            this.record = this.accessory.getService('Record') ||
                this.accessory.addService(this.platform.Service.Switch, 'Record', 'CataNicoGaTa-9002');
            this.record.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.record.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Record');
            this.record.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Record GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Record SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RECORD')]);
                    }
                    setTimeout(() => {
                        this.record.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.movieB === true) {
            this.movie = this.accessory.getService('Movie') ||
                this.accessory.addService(this.platform.Service.Switch, 'Movie', 'CataNicoGaTa-9003');
            this.movie.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.movie.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Movie');
            this.movie.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Movie GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Movie SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MOVIE')]);
                    }
                    setTimeout(() => {
                        this.movie.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.musicB === true) {
            this.music = this.accessory.getService('Music') ||
                this.accessory.addService(this.platform.Service.Switch, 'Music', 'CataNicoGaTa-9004');
            this.music.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.music.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Music');
            this.music.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Music GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Music SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MUSIC')]);
                    }
                    setTimeout(() => {
                        this.music.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.photoB === true) {
            this.photo = this.accessory.getService('Photo') ||
                this.accessory.addService(this.platform.Service.Switch, 'Photo', 'CataNicoGaTa-9005');
            this.photo.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.photo.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Photo');
            this.photo.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Photo GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Photo SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PHOTO')]);
                    }
                    setTimeout(() => {
                        this.photo.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.fileB === true) {
            this.file = this.accessory.getService('File') ||
                this.accessory.addService(this.platform.Service.Switch, 'File', 'CataNicoGaTa-9006');
            this.file.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.file.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'File');
            this.file.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('File GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('File SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('FILE')]);
                    }
                    setTimeout(() => {
                        this.file.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.lightB === true) {
            this.light = this.accessory.getService('Light') ||
                this.accessory.addService(this.platform.Service.Switch, 'Light', 'CataNicoGaTa-9007');
            this.light.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.light.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Light');
            this.light.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Light GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Light SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('LIGHT')]);
                    }
                    setTimeout(() => {
                        this.light.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.screenshotB === true) {
            this.screenshot = this.accessory.getService('Screenshot') ||
                this.accessory.addService(this.platform.Service.Switch, 'Screenshot', 'CataNicoGaTa-9008');
            this.screenshot.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.screenshot.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Screenshot');
            this.screenshot.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Screenshot GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Screenshot SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SCREENSHOT')]);
                    }
                    setTimeout(() => {
                        this.screenshot.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.appSwitchB === true) {
            this.appSwitch = this.accessory.getService('App Switch') ||
                this.accessory.addService(this.platform.Service.Switch, 'App Switch', 'CataNicoGaTa-9009');
            this.appSwitch.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.appSwitch.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'App Switch');
            this.appSwitch.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('App Switch GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('App Switch SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('APPSWITCH')]);
                    }
                    setTimeout(() => {
                        this.appSwitch.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.rebootB === true) {
            this.rebootB = this.accessory.getService('Reboot') ||
                this.accessory.addService(this.platform.Service.Switch, 'Reboot', 'CataNicoGaTa-X09');
            this.rebootB.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.rebootB.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Reboot');
            this.rebootB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Reboot GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Reboot SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('REBOOT')]);
                    }
                    setTimeout(() => {
                        this.rebootB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.remainMovieTimer) {
            this.movieTimer = accessory.getService(this.platform.Service.Valve) || accessory.addService(this.platform.Service.Valve, 'Zidoo Movie Timer', 'Movie Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.Name, 'Zidoo Timer');
            this.movieTimer.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Zidoo Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ValveType, this.platform.Characteristic.ValveType.IRRIGATION);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.Active)
                .on('get', (callback) => {
                    let currentValue = this.currentMovieProgressState ? 1 : 0
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    callback(null);
                });
            this.movieTimer.setCharacteristic(this.platform.Characteristic.InUse, this.platform.Characteristic.InUse.NOT_IN_USE);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration)
                .on('get', (callback) => {
                    let currentValue = (this.movieRemaining - this.movieElapsed);
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4, // 1 day
                });
            this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration)
                .on('get', (callback) => {
                    let currentValue = this.movieRemaining;
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4, // 1 day
                });

        }
        ///////////////Clean up. Delete services not in used////////////////////////////////
        if (this.config.remainMovieTimer === false) {
            this.accessory.removeService(this.movieTimer);
        }
        if (this.config.removePlayback === true) {
            this.accessory.removeService(this.play);
            this.accessory.removeService(this.stop);
            this.accessory.removeService(this.pause);
        }
        if (this.config.powerB === false) {
            this.accessory.removeService(this.service);
        }
        if (this.config.movieControl === false) {
            this.accessory.removeService(this.movieControlL);
            this.accessory.removeService(this.movieControlF);
        }
        if (this.config.cursorUpB === false) {
            this.accessory.removeService(this.cursorUp);
        }
        if (this.config.cursorLeftB === false) {
            this.accessory.removeService(this.cursorLeft);
        }
        if (this.config.cursorDownB === false) {
            this.accessory.removeService(this.cursorDown);
        }
        if (this.config.cursorRightB === false) {

            this.accessory.removeService(this.cursorRight);
        }
        if (this.config.cursorEnterB === false) {

            this.accessory.removeService(this.cursorEnter);
        }
        if (this.config.menuB === false) {
            this.accessory.removeService(this.menu);
        }
        if (this.config.backButtonB === false) {
            this.accessory.removeService(this.backButton);
        }
        if (this.config.homeMenuB === false) {
            this.accessory.removeService(this.homeMenu);
        }
        if (this.config.infoB === false) {
            this.accessory.removeService(this.infoButton);
        }
        if (this.config.goToB === false) {
            this.accessory.removeService(this.goTo);
        }
        if (this.config.pageDownB === false) {
            this.accessory.removeService(this.pageDown);
        }
        if (this.config.pageUpB === false) {
            this.accessory.removeService(this.pageUp);
        }
        if (this.config.popUpMenuB === false) {
            this.accessory.removeService(this.popUpMenu);
        }
        if (this.config.mediaButtons === false) {
            this.accessory.removeService(this.previous);
            this.accessory.removeService(this.next);
            this.accessory.removeService(this.rewindButton);
            this.accessory.removeService(this.forwardButton);
        }
        if (this.config.redB === false) {
            this.accessory.removeService(this.red);
        }
        if (this.config.blueB === false) {
            this.accessory.removeService(this.blue);
        }
        if (this.config.yellowB === false) {
            this.accessory.removeService(this.yellow);
        }
        if (this.config.greenB === false) {
            this.accessory.removeService(this.green);
        }
        if (this.config.audioB === false) {
            this.accessory.removeService(this.audio);
        }
        if (this.config.subtitleB === false) {
            this.accessory.removeService(this.subtitle);
        }
        if (this.config.repeatB === false) {
            this.accessory.removeService(this.repeat);
        }
        if (this.config.pipB === false) {
            this.accessory.removeService(this.pip);
        }
        if (this.config.resolutionB === false) {
            this.accessory.removeService(this.resolution);
        }
        if (this.config.muteB === false) {
            this.accessory.removeService(this.mute);
        }
        if (this.config.recordB === false) {
            this.accessory.removeService(this.record);
        }
        if (this.config.movieB === false) {
            this.accessory.removeService(this.movie);
        }
        if (this.config.musicB === false) {
            this.accessory.removeService(this.music);
        }
        if (this.config.photoB === false) {
            this.accessory.removeService(this.photo);
        }
        if (this.config.fileB === false) {
            this.accessory.removeService(this.file);
        }
        if (this.config.lightB === false) {
            this.accessory.removeService(this.light);
        }
        if (this.config.screenshotB === false) {
            this.accessory.removeService(this.screenshot);
        }
        if (this.config.appSwitchB === false) {
            this.accessory.removeService(this.appSwitch);
        }
        if (this.config.rebootB === false) {
            this.accessory.removeService(this.rebootB);
        }
        if (this.config.changeDimmersToFan === false) {
            this.accessory.removeService(this.volumeFan);
            this.accessory.removeService(this.movieControlF);
        }
        if (this.config.changeDimmersToFan === true) {
            this.accessory.removeService(this.movieControlL);
            this.accessory.removeService(this.volumeDimmer);
        }
        if (this.config.volume === false) {
            this.accessory.removeService(this.volumeDimmer);
            this.accessory.removeService(this.volumeFan);
        }
        //////////////////Connecting to Zidoo
        if (this.config.autoIPMac === true) {
            this.discoveryUPD();
        }
        //syncing////////////////////////////////////////////////////////////////////////////////////////
        setInterval(() => {
            if (this.turnOffCommand === false && this.turnOnCommand === false) {
                this.sending([this.query('MUSIC STATUS')]);
                setTimeout(() => {
                    this.sending([this.query('GET MODEL INFO')]);

                }, 250);
                setTimeout(() => {
                    this.sending([this.query('PLAYBACK STATUS')]);


                }, 500);
                setTimeout(() => {
                    this.sending([this.query('VOLUME STATUS')]);
                }, 750)
                if (this.httpNotResponding >= this.reconnectionTry) {
                    this.turnOffAll();
                    if (this.config.autoIPMac === true) {
                        this.helloMessage();
                    }
                }

                /*
                                this.platform.log('Updating');
                                this.platform.log(this.tvService.getCharacteristic(this.platform.Characteristic.Active).value);
                                this.platform.log(this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.inputName);
                                this.platform.log(this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaDuration);
                                this.platform.log(this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaVideoFormat);
                                this.platform.log(this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaAudioFormat);
                                this.platform.log(this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.language);
                                this.platform.log(this.pause.getCharacteristic(this.platform.Characteristic.On).value);
                                this.platform.log(this.playBackState);
                */
                if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value !== this.powerStateTV) {
                    this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
                }
                if (!this.config.removePlayback) {
                    if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
                        this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
                    }
                    if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                        this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                    }
                    if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                        this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                    }
                }
                if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.inputName) {
                    this.platform.log.debug('Updating Title');
                    //  this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
                    this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                }
                if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                    this.platform.log.debug('Updating Runtime');
                    this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
                    //this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
                }
                if (this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaVideoFormat) {
                    this.platform.log.debug('Updating Video Information');
                    // this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaVideoFormat);
                    this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
                }
                if (this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaAudioFormat) {
                    this.platform.log.debug('Updating Audio Information');
                    //this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                    this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                }
                if (this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.language) {
                    this.platform.log.debug('Updating Language');
                    // this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.language);
                    this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                }
                if (this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.subtitleInfo) {
                    this.platform.log.debug('Updating Additional Information');
                    // this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.subtitleInfo);
                    this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.subtitleInfo);
                }
            }
            else {
                setTimeout(() => {
                    this.turnOffCommand = false;
                    this.turnOnCommand = false;
                }, 6000);
            }

        }, this.config.pollingInterval);
    }
    ////Recover names from Homekit

    ensureName(hap, service, name) {
        const key = [
            `homebridge-zidoo-androidtv`,
            `configured-name`,
            name.replaceAll(" ", "_"),
        ].join("-");
        service.addOptionalCharacteristic(hap.Characteristic.ConfiguredName);
        if (!hap.HAPStorage.storage().getItemSync(key)) {
            service.setCharacteristic(hap.Characteristic.ConfiguredName, name);
        }
        service
            .getCharacteristic(hap.Characteristic.ConfiguredName)
            .on("change", ({ newValue }) => {
                hap.HAPStorage.storage().setItemSync(key, newValue);
            });
    }
    ////////////////Zidoo discovery
    discoveryUPD() {
        this.discovery = udp.createSocket({ type: 'udp4', reuseAddr: true });
        this.discovery.on('error', (error) => {
            this.platform.log.debug(error);
            this.discovery.close();
        });
        this.discovery.on('listening', () => {
            var address = this.discovery.address();
            this.platform.log.debug('UDP Client listening on ' + address.address + ":" + address.port);
            this.discovery.setBroadcast(true)
            this.discovery.setMulticastTTL(128);
            this.discovery.addMembership('239.39.3.9');
            this.helloMessage();
        });

        this.discovery.on('message', (message, remote) => {
            this.platform.log.debug('Message received From: ' + remote.address + ':' + remote.port);
            let newMessage = String.fromCharCode(...message);
            newMessage = newMessage.substring(newMessage.indexOf("\n") + 1)
            var properties = newMessage.split('\r\n');
            var zidooInfo = {};
            properties.forEach((property) => {
                var tup = property.split(':');
                zidooInfo[tup[0]] = tup[1];
            });
            if (typeof zidooInfo !== 'undefined' && !zidooInfo.host.includes('239.39.3.9')) {
                this.platform.log.debug(zidooInfo);
                this.ZIDOO_IP = zidooInfo.host.replace(/\s+/g, '');
                this.IPReceived = true;
            }
        });
        this.discovery.bind(this.ZIDOO_UDP_PORT);

    }
    //////Zidoo Hello message
    helloMessage() {
        this.hello = udp.createSocket({ type: 'udp4', reuseAddr: true });
        let message = new Buffer.from('JOIN\r\nuuid: CataNico\r\ntype: 2\r\nhost: 239.39.3.9\r\nport: 18239\r\n\r\n');
        this.hello.send(message, 18239, '239.39.3.9', (err) => {
            if (err !== null) {
                this.platform.log.debug('Error sending UDP message: ' + err);
                setTimeout(() => {
                    this.helloMessage();
                }, 2000);
            }
            // this.platform.log('UDP message sent to ' + HOST + ':' + PORT);
            this.hello.close();
        });
    }


    ///////////////Wake up/////
    WakeupOnLAN() {
        if (this.config.mac !== 'CA:TA:NI:CO:GA:TA') {
            this.macReceived === true;
        }
        if (this.config.autoIPMac === false || this.macReceived === true) {
            WOL.wake(this.config.mac, (err) => {
                if (err) {
                    this.platform.log(`Could not wake up ${this.config.name}: ${err}`);
                    this.newPowerState(false);
                }
                this.platform.log(`${this.config.name} woke up!`);
                this.newPowerState(true);
                this.turnOffCommand = true;
                setTimeout(() => {
                    if (this.powerState === false) {
                        this.platform.log(`Startup time of 60 secods expired, reverting state to offline`);
                    }
                }, 60000);
            });
        }
        else {
            this.platform.log('IP and MAC addresses are not set yet, turn on the device')
        }
    }
    /////

    ///////Handlers////////////////////////////////////////////////////////////////////////////////////////
    setOn(value, callback) {
        let zidooState = value;
        if (zidooState === true) {
            this.newPowerState(true);
            this.turnOnCommand = true;
            this.turnOffCommand = false;
            this.WakeupOnLAN();
            /*
                this.sending([this.query('GET MODEL INFO')]);
                this.sending([this.query('PLAYBACK STATUS')]);
                this.sending([this.query('MUSIC STATUS')]);
                this.sending([this.pressedButton('POWER ON')]);
                */
        }
        else {
            if (this.playBackState[0] === true || this.playBackState[1] === true) {
                this.sending([this.pressedButton('STOP')]);
                this.newPowerState(false);
                this.turnOffCommand = true;
                this.turnOnCommand = false;
                this.turnOffAll();
                setTimeout(() => {
                    this.sending([this.pressedButton('POWER OFF')]);
                }, 100);
            }
            else {
                this.newPowerState(false);
                this.turnOffCommand = true;
                this.turnOnCommand = false;
                this.turnOffAll();
                this.sending([this.pressedButton('POWER OFF')]);
            }
        }
        this.platform.log.debug('Set Power to ->', value);
        callback(null);
    }
    getOn(callback) {
        let isOn = this.powerState;
        this.platform.log.debug('Get Power ->', isOn);
        callback(null, isOn);
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////Play
    playSwitchStateGet(callback) {
        this.platform.log.debug('Play State');
        let currentValue = this.playBackState[0];
        callback(null, currentValue);
    }
    playSwitchStateSet(value, callback) {
        this.platform.log.debug('Play set to:', value);
        if (value === true) {
            this.sending([this.pressedButton('PLAY')]);
        }
        callback(null);
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////Pause
    pauseSwitchStateGet(callback) {
        this.platform.log.debug('Pause State');
        let currentValue = this.playBackState[1];
        callback(null, currentValue);
    }
    pauseSwitchStateSet(value, callback) {
        this.platform.log.debug('Pause set to', value);
        if (value === true) {
            this.sending([this.pressedButton('PAUSE')]);
        }
        callback(null);
    }
    /////////////////////////////////////////////////////////////////////////////////////stop
    stopSwitchStateGet(callback) {
        this.platform.log.debug('Stop State');
        let currentValue = this.playBackState[2];
        callback(null, currentValue);
    }
    stopSwitchStateSet(value, callback) {
        this.platform.log.debug('Stop set to:', value);
        if (value === true) {
            this.sending([this.pressedButton('STOP')]);
        }
        callback(null);
    }
    /////////////////Command Log
    commandLog(commandPress) {
        if (commandPress.includes('getModel') || commandPress.includes('getState') || commandPress.includes('getPlayStatus') || commandPress.includes('volumeStatus')) {
            this.platform.log.debug(`Sending: ${this.commandName(commandPress)} Command`);
        }
        else {
            this.platform.log(`Sending: ${this.commandName(commandPress)} Command`);
        }
    }

    ///////Send HTTP command///////////////////////////

    sending(url) {
        this.httpNotResponding += 1;
        if (this.config.autoIPMac === false || this.IPReceived === true) {
            let regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
            if (regexExp.test(this.ZIDOO_IP)) {
                this.platform.log.debug(url);
                url = url[0];
                let key;
                if (url.includes('getState')) {
                    key = 'getState';
                }
                else if (url.includes('getPlayStatus')) {
                    key = 'getPlayStatus';
                }
                else if (url.includes('getModel')) {
                    key = 'getModel';
                }
                else if (url.includes('seek')) {
                    key = 'seek'
                }
                else if (url.includes('RemoteControl/changeVolume?type=')) {
                    key = 'volumeStatus'
                }
                else {
                    let key1 = url.split('=');
                    key = key1[1];
                }
                this.platform.log.debug(url);
                this.platform.log.debug(key);
                this.commandLog(key);
                request.get(url, (res) => {
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => { rawData += chunk; });
                    res.on('end', () => {
                        try {
                            let parsedData = JSON.parse(rawData);
                            this.httpNotResponding = 0;
                            this.httpEventDecoder(parsedData, key);
                        } catch (e) {
                            //console.log('Catch error: ' + e.message);
                        }
                    });
                }).on('error', (e) => {
                    //console.log(`Got error: ${e.message}`);
                });
            }
            else {
                this.platform.log.debug('IP address is not valid');
            }
        }
        else {
            this.platform.log.debug('IP address is not set yet, turn on the device');
        }
    }

    //////////Current Status//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    newVolumeStatus(newVolumeNum) {
        if (this.turnOffCommand !== true || newVolumeNum === 0) {
            if (this.currentVolume !== newVolumeNum) {
                this.currentVolume = newVolumeNum;
                if (newVolumeNum === 0) {
                    this.currentMuteState = true;
                    this.currentVolumeSwitch = false;
                }
                if (newVolumeNum !== 0) {
                    this.currentMuteState = false;
                    this.currentVolumeSwitch = true;
                }
                this.speakerService.updateCharacteristic(this.platform.Characteristic.Volume, this.currentVolume);
                this.speakerService.updateCharacteristic(this.platform.Characteristic.Mute, this.currentMuteState);
                // this.speakerService.getCharacteristic(this.platform.Characteristic.Volume).updateValue(this.currentVolume);
                // this.speakerService.getCharacteristic(this.platform.Characteristic.Mute).updateValue(this.currentMuteState)
                if (this.config.volume === true) {
                    if (this.config.changeDimmersToFan === false) {
                        this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentVolume);
                        //this.volumeDimmer.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentVolume);
                        this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.On, this.currentVolumeSwitch);
                        //this.volumeDimmer.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentVolumeSwitch);
                    }
                    else {
                        this.volumeFan.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.currentVolume);
                        // this.volumeFan.getCharacteristic(this.platform.Characteristic.RotationSpeed).updateValue(this.currentVolume);
                        this.volumeFan.updateCharacteristic(this.platform.Characteristic.Active, this.currentVolumeSwitch === true ? 1 : 0);
                        // this.volumeFan.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.currentVolumeSwitch === true ? 1 : 0);
                    }
                }
            }
        }
    }
    newAudioStatus(audio) {
        this.platform.log.debug(audio);
        let audioFormat = '';
        if (audio.includes('Digital Plus')) {
            audioFormat = 'Dolby Digital Plus';
        }
        else if (audio.includes('Dolby Digital')) {
            audioFormat = 'Dolby Digital';
        }
        else if (audio.includes('TrueHD')) {
            audioFormat = 'Dolby TrueHD-Atmos';
        }
        else if (audio.includes('DTS-HD High')) {
            audioFormat = 'DTS-HD High Resolution';
        }
        else if (audio.includes('DTS-HD Master') || audio.includes('DTS-HD MA')) {
            audioFormat = 'DTS-HD MA - DTS X';
        }
        else if (audio.includes('DTS-HD')) {
            audioFormat = 'DTS-HD';
        }
        else if (audio.includes('DTS')) {
            audioFormat = 'DTS';
        }
        else if (audio.includes('LPCM')) {
            audioFormat = 'LPCM';
        }
        else if (audio.includes('MPEG')) {
            audioFormat = 'MPEG Audio';
        }
        else if (audio.includes('CD Audio')) {
            audioFormat = 'CD Audio';
        }
        else {
            audioFormat = 'Unknown';
        }
        this.newAudioFormat(audioFormat);
    }
    newInputName(newName) {
        if (typeof newName !== 'undefined') {
            this.platform.log.debug('New input name: ' + newName);
            if (this.inputName !== newName) {
                //this.platform.log(newName);
                this.inputName = newName;
                this.platform.log.debug(this.inputName);
                this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                //this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
            }
        }
    }
    newInputDuration(newDuration) {
        if (typeof newDuration !== 'undefined') {
            this.platform.log.debug('New input duraiton: ' + newDuration);
            if (!newDuration.includes('Runtime')) {
                let hourMintue = ''
                if (this.movieRemaining > 3600) {
                    hourMintue = 'Hours';
                }
                else if (this.movieRemaining == 3600) {
                    hourMintue = 'Hour';
                }
                else {
                    hourMintue = 'Minutes';
                }
                this.mediaDuration = 'Runtime: ' + newDuration + ' ' + hourMintue;
            }
            else {
                this.mediaDuration = newDuration;
            }
            if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration)
            }
        }
    }
    newVideoFormat(videoFormat) {
        if (typeof videoFormat !== 'undefined') {
            this.platform.log.debug('New input progress: ' + videoFormat);
            this.platform.log.debug(videoFormat);
            if (this.mediaVideoFormat !== videoFormat) {
                this.platform.log.debug(videoFormat);
                this.mediaVideoFormat = videoFormat;
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    newSubtitle(newSub) {
        this.platform.log.debug(newSub);
        if (this.subtitleInfo !== newSub) {
            this.subtitleInfo = newSub;
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.subtitleInfo);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
    }
    newAudioFormat(audioType) {
        if (typeof audioType !== 'undefined') {
            this.platform.log.debug(audioType);
            this.platform.log.debug('New audio information: ' + audioType);
            this.platform.log.debug(audioType);
            if (this.mediaAudioFormat !== audioType) {
                this.mediaAudioFormat = audioType;
                this.platform.log.debug(audioType);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    newLanguage(lang) {
        if (typeof lang !== 'undefined') {
            this.platform.log.debug('New audio language: ' + lang);
            if (this.language !== lang) {
                this.language = lang;
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    newMovieTime(newMovieTime) {
        if (newMovieTime === 0) {
            this.currentMovieProgressState = false;
            this.currentMovieProgress = 0;
        }
        if (newMovieTime !== 0) {
            this.currentMovieProgressState = true;
        }
        if (this.movieRemaining !== 0) {
            this.currentMovieProgress = Math.round(newMovieTime * 100 / (this.movieRemaining));
        }
        if (this.currentMovieProgressState === true && this.currentMovieProgress === 0) {
            this.currentMovieProgress = 1;
        }
        if (this.currentMovieProgress > 100) { this.currentMovieProgress = 100 }
        if (this.config.movieControl === true) {
            if (this.config.changeDimmersToFan === false) {
                if (this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).value !== this.currentMovieProgress) {
                    this.movieControlL.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentMovieProgress);
                    //this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentMovieProgress);
                    this.movieControlL.updateCharacteristic(this.platform.Characteristic.On, this.currentMovieProgressState);
                    //this.movieControlL.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentMovieProgressState);
                }
            }
            else {
                if (this.movieControlF.getCharacteristic(this.platform.Characteristic.RotationSpeed).value !== this.currentMovieProgress) {
                    this.movieControlF.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.currentMovieProgress);
                    // this.movieControlF.getCharacteristic(this.platform.Characteristic.RotationSpeed).updateValue(this.currentMovieProgress);
                    this.movieControlF.updateCharacteristic(this.platform.Characteristic.Active, this.currentMovieProgressState === true ? 1 : 0);
                    //this.movieControlF.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.currentMovieProgressState === true ? 1 : 0);
                }
            }
        }
        if (this.config.remainMovieTimer) {
            if (this.movieTimer.getCharacteristic(this.platform.Characteristic.Active).value != this.currentMovieProgressState ? 1 : 0) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.Active, this.currentMovieProgressState ? 1 : 0);
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.InUse, this.currentMovieProgressState ? 1 : 0);
            }
            if (this.movieElapsed !== this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration).value) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.RemainingDuration, (this.movieRemaining - this.movieElapsed));
            }
            if (this.movieRemaining !== this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration).value) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.SetDuration, this.movieRemaining);
            }
        }
    }
    newPowerState(newValue) {
        if (newValue === true) {
            this.powerStateTV = 1;
        }
        else {
            this.powerStateTV = 0;
        }
        if (this.powerState !== newValue) {
            this.powerState = newValue;
            this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
            //this.tvService.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.powerStateTV);
            if (this.config.powerB === true) {
                this.service.updateCharacteristic(this.platform.Characteristic.On, this.powerState);
                //this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.powerState);
            }
        }
    }
    newPlayBackState(newPlay) {
        this.playBackState = newPlay;
        if (this.turnOffCommand == false || this.playBackState == [false, false, false]) {
            if (this.playBackState[0] === true) {
                this.mediaState = 0;
            }
            if (this.playBackState[1] === true) {
                this.mediaState = 1;
            }
            if (this.playBackState[2] === true) {
                this.mediaState = 2;
            }
            if (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false) {
                this.mediaState = 4;
            }

            if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value !== this.powerStateTV) {
                this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
            }
            if (!this.config.removePlayback) {
                if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
                    this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
                    //this.play.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[0]);
                    this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
                }
                if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                    this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                    //this.pause.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[1]);
                    this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
                }
                if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                    this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                    //this.stop.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[2]);
                    this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
                }
            }
        }
    }
    newInputState(newInput) {
        this.inputState = newInput;
        if (this.inputState[0] === true) {
            this.inputID = 1;
        }
        else if (this.inputState[1] === true) {
            this.inputID = 2;
        }
        else if (this.inputState[2] === true) {
            this.inputID = 3;
        }
        else if (this.inputState[3] === true) {
            this.inputID = 4;
        }
        else if (this.inputState[4] === true) {
            this.inputID = 5;
        }
        else if (this.inputState[5] === true) {
            this.inputID = 6;
        }
        else if (this.inputState[0] === false && this.inputState[1] === false && this.inputState[2] === false
            && this.inputState[3] === false && this.inputState[4] === false && this.inputState[5] === false) {
            this.inputID = 0;
        }
        else {
        }
        this.tvService.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        // this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).updateValue(this.inputID);
    }
    /////////////////HTTP Event decoder
    httpEventDecoder(rawData, key) {
        this.platform.log.debug(`${key} Sent by HTTP`);
        this.platform.log.debug(rawData);
        if (rawData.status === 806) {
            this.moviePlaying = false;
        }
        else if (rawData.status === 200) {
            if (this.config.mac !== rawData.net_mac && typeof rawData.net_mac !== 'undefined') {
                this.config.mac = rawData.net_mac
                this.macReceived = true;
            }
            else {
                this.macReceived = true;
            }
            if (key.includes('getModel') || key.includes('getState') || key.includes('getPlayStatus') || key.includes('volumeStatus')) {
                this.platform.log.debug(`Response: ${this.commandName(key)} Command Executed`);
            }
            else {
                this.platform.log(`Response: ${this.commandName(key)} Command Executed`);
            }
            if (key.includes('Power')) {
                this.turnOffAll();
            }
            else if (key.includes('volumeStatus')) {
                this.maxVolume = rawData.maxVolume;
                let normalizedVolume = Math.round((rawData.currentVolume / this.maxVolume) * 100);
                this.newVolumeStatus(normalizedVolume)
            }
            else if (key.includes('MediaPlay')) {
                if (key.includes('MediaPlay.Pause')) {
                }
                else {
                    this.newPlayBackState([true, false, false]);
                }
            }
            else if (key.includes('MediaStop')) {
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            else if (key.includes('MediaPasue')) {
                this.newPlayBackState([false, true, false]);

            }
            else if (key.includes('getModel')) {
                if (this.turnOffCommand !== true) {
                    this.newPowerState(true);
                }
            }
            else if (key.includes('getPlayStatus')) {
                if (this.turnOffCommand !== true) {
                    this.newPowerState(true);
                }
                ////////Playback Status
                this.platform.log.debug(rawData.video.status);
                this.platform.log.debug(this.musicPlaying);
                if (rawData.video.status === 0 && this.musicPlaying === false) {
                    this.newPlayBackState([false, true, false]);
                    this.moviePlaying = true;
                    this.showState = true;
                }
                if (rawData.video.status === 1) {
                    this.newPlayBackState([true, false, false]);
                    this.moviePlaying = true;
                    this.showState = true;
                }
                if (rawData.video.path !== '') {
                    this.platform.log.debug(rawData);
                    let movie3D = '';
                    if (rawData['3D'].information == '3D') {
                        movie3D = ' (3D)'
                    }
                    else {
                        movie3D == '';
                    }
                    //////////////////////Media Name///////////////////////////////
                    if (rawData.video.title === 'AVCHD') {
                        let newNameInput = rawData.video.path.split('/');
                        let nameInput = '';
                        if (Object.values(newNameInput)[Object.keys(newNameInput).length - 1] === 'AVCHD') {
                            nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 2];
                            if (nameInput.includes('.iso') || nameInput.includes('.ISO') || nameInput.includes('.MKV') || nameInput.includes('.mkv') || nameInput.includes('.MP4') || nameInput.includes('.mp4') || nameInput.includes('.MP3') || nameInput.includes('.mp3')) {
                                nameInput = nameInput.substring(0, nameInput.length - 4);
                            }
                            this.newInputName(this.nameLengthCheck(nameInput + movie3D));
                        }
                        else {
                            fnameInput = rawData.video.title;
                            if (nameInput.includes('.iso') || nameInput.includes('.ISO') || nameInput.includes('.MKV') || nameInput.includes('.mkv') || nameInput.includes('.MP4') || nameInput.includes('.mp4') || nameInput.includes('.MP3') || nameInput.includes('.mp3')) {
                                nameInput = nameInput.substring(0, nameInput.length - 4);
                            }
                            this.newInputName(this.nameLengthCheck(nameInput + movie3D));
                        }
                    }
                    else {
                        let nameInput = rawData.video.title;
                        if (nameInput.includes('.iso') || nameInput.includes('.ISO') || nameInput.includes('.MKV') || nameInput.includes('.mkv') || nameInput.includes('.MP4') || nameInput.includes('.mp4') || nameInput.includes('.MP3') || nameInput.includes('.mp3')) {
                            nameInput = nameInput.substring(0, nameInput.length - 4);
                        }
                        this.newInputName(this.nameLengthCheck(nameInput + movie3D));
                    }
                    //////////Media runtime////////////////////
                    this.movieRemaining = parseInt(rawData.video.duration / 1000);
                    let runtimeNumber = this.secondsToTime(parseInt(rawData.video.duration) / 1000);
                    if (runtimeNumber.startsWith('0')) {
                        runtimeNumber = runtimeNumber.substring(1);
                    }
                    this.newInputDuration(runtimeNumber);
                    //////////////////Media Current position
                    this.movieElapsed = parseInt(rawData.video.currentPosition) / 1000;
                    this.newMovieTime(parseInt(rawData.video.currentPosition) / 1000);


                    //////////////////////////////////////////////////////////////////

                    if (typeof rawData.video.output !== 'undefined') {
                        //////////////Video format////////////////////////
                        let videoOutput = rawData.video.output.split(' ');
                        this.platform.log.debug(videoOutput);
                        this.platform.log.debug(Object.values(videoOutput)[Object.keys(videoOutput).length - 1]);
                        let currentBitrate = rawData.video.bitrate;
                        /////
                        let videoHeight = rawData.video.height;
                        let videoWitdth = rawData.video.width;
                        /////
                        let movieAspectRatio = videoOutput[0];
                        let movieFileSize = rawData.video.filesize;
                        let framesPerSecond = Math.round(rawData.video.fps * 1000) / 1000;
                        let movieInfo = '';
                        if (videoHeight >= 2160) {
                            movieInfo = '4K Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight > 1080) {
                            movieInfo = 'UHD Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight == 1080) {
                            movieInfo = 'Full HD Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight == 720) {
                            movieInfo = 'HD Video (' + movieAspectRatio + ')';
                        }
                        else {
                            movieInfo = 'SD Video (' + movieAspectRatio + ')';
                        }

                        let hdrFormat = rawData.video.output;

                        if (hdrFormat.includes('DV')) {
                            hdrFormat = 'Dolby Vision';
                        }
                        else if (hdrFormat.includes("HLG")) {
                            hdrFormat = 'HLG';
                        }
                        else if (hdrFormat.includes('+') || hdrFormat.includes('PLUS')) {
                            hdrFormat = 'HDR10+';
                        }
                        else if (!hdrFormat.includes('HDR')) {
                            hdrFormat = 'SDR';
                        }
                        else {
                            hdrFormat = 'HDR';
                        }
                        this.newVideoFormat(this.nameLengthCheck(hdrFormat + ' ' + movieInfo + ' at ' + framesPerSecond + ' Hz and ' + currentBitrate));
                        //////////Audio Lnaguage

                        let languageOutput = rawData.audio.information.split(' ');
                        this.platform.log.debug(Object.values(languageOutput)[0] + ' ' + languageOutput[languageOutput.length - 1]);

                        this.newLanguage(this.nameLengthCheck('Audio: ' + Object.values(languageOutput)[0] + ' ' + languageOutput[languageOutput.length - 1]));

                        ///////////////Audio format
                        this.platform.log.debug(rawData.audio.information);
                        let videoAudioInfo = rawData.audio.information.split(" channel ")
                        let videoAudioInfo0 = videoAudioInfo[0].split(' ')
                        let audioText = '';
                        for (let i = 1; i < videoAudioInfo0.length; i++) {
                            audioText += videoAudioInfo0[i] + ' ';
                        }
                        this.newAudioFormat(this.nameLengthCheck('Sound: ' + audioText + videoAudioInfo[1]));

                        ////////////////////Subtiles////////////////////////////
                        let subtitlesOn = rawData.subtitle.information;
                        if (subtitlesOn == 'Off') {
                            this.newSubtitle(this.nameLengthCheck('Subtitles: ' + ' File Size: ' + movieFileSize));

                        }
                        else {
                            subtitlesOn = subtitlesOn.split(' ');
                            this.newSubtitle(this.nameLengthCheck('Subtitles: ' + subtitlesOn[0] + ' ' + subtitlesOn[subtitlesOn.length - 1] + ', File Size: ' + movieFileSize));
                        }
                    }
                    else {

                        let videoHeight = rawData.video.height;
                        let videoWitdth = rawData.video.width;
                        let framesPerSecond = Math.round(rawData.video.fps * 1000) / 1000;
                        /////
                        let movieAspectRatio = videoWitdth + 'x' + videoHeight;
                        let movieInfo = '';
                        if (videoHeight >= 2160) {
                            movieInfo = '4K Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight > 1080) {
                            movieInfo = 'UHD Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight == 1080) {
                            movieInfo = 'Full HD Video (' + movieAspectRatio + ')';
                        }
                        else if (videoHeight == 720) {
                            movieInfo = 'HD Video (' + movieAspectRatio + ')';
                        }
                        else {
                            movieInfo = 'SD Video (' + movieAspectRatio + ')';
                        }

                        this.newVideoFormat(this.nameLengthCheck(movieInfo + ' at ' + framesPerSecond + ' Hz'));

                        ///////////////Audio format
                        this.platform.log.debug(rawData.audio.information);
                        let videoAudioInfo = rawData.audio.information.split(" ")
                        this.platform.log.debug(Object.values(videoAudioInfo)[1] + ' ' + '(' + videoAudioInfo[0] + ')');

                        this.newLanguage(this.nameLengthCheck('Audio: ' + Object.values(videoAudioInfo)[1] + ' ' + '(' + videoAudioInfo[0] + ')'));
                        let audioText = '';
                        for (let i = 2; i < videoAudioInfo.length; i++) {
                            audioText += videoAudioInfo[i] + ' ';
                        }
                        this.newAudioFormat(this.nameLengthCheck('Sound: ' + audioText));

                        ////////////////////Subtiles////////////////////////////
                        this.newSubtitle('Additional Information');
                        let subtitlesOn = rawData.subtitle.information;
                        subtitlesOn = subtitlesOn.split(' ');
                        this.newSubtitle(this.nameLengthCheck('Subtitles: ' + subtitlesOn[0]));

                    }
                    //////////////////////////////////////////////////////////////
                }
            }
        }
        else if (key.includes('getState')) {
            this.platform.log.debug(rawData);
            this.platform.log.debug(rawData.state);
            this.platform.log.debug(this.moviePlaying);
            if (this.turnOffCommand !== true) {
                this.newPowerState(true);
            }
            if (rawData.state === 3) {
                this.newPlayBackState([true, false, false]);
                this.showState = true;
                this.musicPlaying = true;
            }
            else if (rawData.state === 4) {
                this.newPlayBackState([false, true, false]);
                this.showState = true;
                this.musicPlaying = true;
            }
            else if (rawData.state === 0 && this.moviePlaying === false) {
                this.musicPlaying = false;
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            else if (rawData.state === 0) {
                this.musicPlaying = false;
            }
            if (rawData.state !== 0) {
                if (this.turnOffCommand !== true) {
                    this.newPowerState(true);
                }
                this.platform.log.debug("Music details")
                this.platform.log.debug(rawData);
                ////////Playback Status
                //////////////////Media Current position
                this.movieRemaining = parseInt(rawData.duration / 1000);
                this.newMovieTime(parseInt(rawData.position) / 1000);
                ////////////////////Media elapsed time////////////////////////////
                this.newSubtitle('Audio Channels: ' + rawData.playingMusic.channels + ', ' + 'Sample Rate: ' + rawData.playingMusic.sampleRate);
                //////////////Audio format////////////////////////
                this.newVideoFormat('Format: ' + rawData.playingMusic.extension);
                ///////////////Audio Bitrate
                this.newAudioFormat('Bitrate: ' + rawData.playingMusic.bitrate);
                //////////Audio file size
                this.newLanguage('File Size: ' + rawData.playingMusic.fileSize);
                //////////////////////Media Name///////////////////////////////
                let songTitle = rawData.playingMusic.title + " - " + rawData.playingMusic.artist;
                /// this.platform.log(songTitle.length)
                this.newInputName(this.nameLengthCheck(songTitle));
                //////////Media runtime////////////////////
                let runtimeNumber = this.secondsToTime(parseInt(rawData.duration) / 1000);
                if (runtimeNumber.startsWith('0')) {
                    runtimeNumber = runtimeNumber.substring(1);
                }
                this.newInputDuration(runtimeNumber);
            }
        }
    }
    ////Name Check
    nameLengthCheck(newName) {
        if (newName.length >= 64) {
            newName = newName.slice(0, 60) + '...';
        }
        return newName;
    }
    ///Query////////////////////////////////////////////////////////////////////////////////////////////////////
    query(qName) {
        let key;
        key = "http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/";
        switch (qName) {
            //POWER ButtonGroup
            case 'GET MODEL INFO':
                key += 'ZidooControlCenter/getModel';
                break;
            case 'MUSIC STATUS':
                key += 'ZidooMusicControl/v2/getState';
                break;
            case 'PLAYBACK STATUS':
                key += 'ZidooVideoPlay/getPlayStatus';
                break;
            case 'VOLUME STATUS':
                key += 'ZidooControlCenter/RemoteControl/changeVolume?type=3';
                break;
        }
        return key;
    }
    //////////Sending Command Dame Decoder///////////
    commandName(keyS) {
        this.platform.log.debug(keyS);
        let keySent = '';

        if (keyS.includes('Poweroff')) {
            keySent = 'Power Off';
        }
        else if (keyS.includes('Standby')) {
            keySent = 'Standby';
        }
        else if (keyS.includes('Reboot')) {
            keySent = 'Reboot';
        }
        else if (keyS.includes('PowerOn')) {
            keySent = 'Power On';
        }
        else if (keyS.includes('Up')) {
            keySent = 'Cursor Up';
        }
        else if (keyS.includes('Down')) {
            keySent = 'Cursor Down';
        }
        else if (keyS.includes('Left')) {
            keySent = 'Cursor Left';
        }
        else if (keyS.includes('Right')) {
            keySent = 'Cursor Right';
        }
        else if (keyS.includes('Ok')) {
            keySent = 'Enter';
        }
        else if (keyS.includes('Menu')) {
            keySent = 'Menu';
        }
        else if (keyS.includes('Back')) {
            keySent = 'Back';
        }
        else if (keyS.includes('MediaPlay.Pause')) {
            keySent = 'Play/Pause';
        }
        else if (keyS.includes('MediaPlay')) {
            keySent = 'Play';
        }
        else if (keyS.includes('MediaPause')) {
            keySent = 'Pause';
        }
        else if (keyS.includes('MediaStop')) {
            keySent = 'Stop';
        }
        else if (keyS.includes('MediaPrev')) {
            keySent = 'Previous Chapter';
        }
        else if (keyS.includes('MediaNext')) {
            keySent = 'Next Chapter';
        }
        else if (keyS.includes('Home')) {
            keySent = 'Home Menu';
        }
        else if (keyS.includes('Info')) {
            keySent = 'Information';
        }
        else if (keyS.includes('MediaBackward')) {
            keySent = 'Rewind';
        }
        else if (keyS.includes('MediaForward')) {
            keySent = 'Forward';
        }
        else if (keyS.includes('PageUP')) {
            keySent = 'Page Up';
        }
        else if (keyS.includes('PageDown')) {
            keySent = 'Page Down';
        }
        else if (keyS.includes('PopMenu')) {
            keySent = 'Pop-Up Menu';
        }
        else if (keyS.includes('UserDefine_A')) {
            keySent = 'Red';
        }
        else if (keyS.includes('UserDefine_B')) {
            keySent = 'Green';
        }
        else if (keyS.includes('UserDefine_D')) {
            keySent = 'Blue';
        }
        else if (keyS.includes('UserDefine_C')) {
            keySent = 'Yellow';
        }
        else if (keyS.includes('Audio')) {
            keySent = 'Audio';
        }
        else if (keyS.includes('Subtitle')) {
            keySent = 'Subtitle';
        }
        else if (keyS.includes('Repeat')) {
            keySent = 'Repeat';
        }
        else if (keyS.includes('Pip')) {
            keySent = 'PIP';
        }
        else if (keyS.includes('Resolution')) {
            keySent = 'Resolution';
        }

        else if (keyS.includes('VolumeUp')) {
            keySent = 'Volume Up';
        }
        else if (keyS.includes('VolumeDown')) {
            keySent = 'Volume Down';
        }
        else if (keyS.includes('Mute')) {
            keySent = 'Mute';
        }
        else if (keyS.includes('Record')) {
            keySent = 'Record';
        }
        else if (keyS.includes('movie')) {
            keySent = 'Movie';
        }
        else if (keyS.includes('music')) {
            keySent = 'Music';
        }
        else if (keyS.includes('photo')) {
            keySent = 'Photo';
        }
        else if (keyS.includes('file')) {
            keySent = 'File';
        }
        else if (keyS.includes('light')) {
            keySent = 'Light';
        }
        else if (keyS.includes('Screenshot')) {
            keySent = 'Screenshot';
        }
        else if (keyS.includes('APP.Switch')) {
            keySent = 'App Switch';
        }
        else if (keyS.includes('getModel')) {
            keySent = 'Get Model Information';
        }
        else if (keyS.includes('getState')) {
            keySent = 'Music Information';
        }
        else if (keyS.includes('getPlayStatus')) {
            keySent = 'Movie Information';
        }
        else if (keyS.includes('changeVolume')) {
            keySent = 'Volume Status';
        }
        else if (keyS.includes('seek')) {
            keySent = 'Searching';
        }
        else {
            keySent = keyS
        }
        return keySent
    }
    /////Zidoo controls/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    pressedButton(name) {
        let key;
        key = "http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/sendkey?key=Key.";
        switch (name) {
            //POWER ButtonGroup
            case 'POWER ON':
                key += 'PowerOn';
                break;
            case 'POWER OFF':
                if (this.config.standby === false) {
                    key += 'PowerOn.Poweroff';
                }
                else {
                    key += 'PowerOn.Standby';
                }
                break;
            case 'REBOOT':
                key += 'PowerOn.Reboot';
                break;
            case 'CURSOR UP':
                key += 'Up';
                break;
            case 'CURSOR DOWN':
                key += 'Down';
                break;
            case 'CURSOR LEFT':
                key += 'Left';
                break;
            case 'CURSOR RIGHT':
                key += 'Right';
                break;
            case 'CURSOR ENTER':
                key += 'Ok';
                break;
            case 'MENU':
                key += 'Menu';
                break;
            case 'BACK':
                key += 'Back';
                break;
            case 'PLAY':
                key += 'MediaPlay';
                break;
            case 'PLAY/PAUSE':
                key += 'MediaPlay.Pause';
                break;
            case 'PAUSE':
                key += 'MediaPause';
                break;
            case 'STOP':
                key += 'MediaStop';
                break;
            case 'PREVIOUS':
                key += 'MediaPrev';
                break;
            case 'NEXT':
                key += 'MediaNext';
                break;
            case 'HOME MENU':
                key += 'Home';
                break;
            case 'INFO':
                key += 'Info';
                break;
            case 'REWIND':
                key += 'MediaBackward';
                break;
            case 'FORWAD':
                key += 'MediaForward';
                break;
            case 'PAGE UP':
                key += 'PageUP';
                break;
            case 'PAGE DOWN':
                key += 'PageDown';
                break;
            case 'POP-UP MENU':
                key += 'PopMenu';
                break;
            case 'RED':
                key += 'UserDefine_A';
                break;
            case 'GREEN':
                key += 'UserDefine_B';
                break;
            case 'BLUE':
                key += 'UserDefine_D';
                break;
            case 'YELLOW':
                key += 'UserDefine_C';
                break;
            case 'AUDIO':
                key += 'Audio';
                break;
            case 'SUBTITLE':
                key += 'Subtitle';
                break;
            case 'REPEAT':
                key += 'Repeat';
                break;
            case 'PIP':
                key += 'Pip';
                break;
            case 'RESOLUTION':
                key += 'Resolution';
                break;
            case 'VOLUME UP':
                key += 'VolumeUp';
                break;
            case 'VOLUME DOWN':
                key += 'VolumeDown';
                break;
            case 'MUTE':
                key += 'Mute';
                break;
            case 'RECORD':
                key += 'Record';
                break;
            case 'MOVIE':
                key += 'movie';
                break;
            case 'MUSIC':
                key += 'music';
                break;
            case 'PHOTO':
                key += 'photo';
                break;
            case 'FILE':
                key += 'file';
                break;
            case 'LIGHT':
                key += 'light';
                break;
            case 'SCREENSHOT':
                key += 'Screenshot';
                break;
            case 'APPSWITCH':
                key += 'APP.Switch';
                break;
        }
        // key += '\r\n';
        // this.platform.log(key);
        return key;
    }
    /////////Data Management/////////////////////////////////////////////////////////////
    timeToSeconds(hms) {
        let a = hms.split(':');
        let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
        return seconds;
    }

    justNumber(number) {
        let timeDate = number.replace(/^\D+/g, '')
        return timeDate
    }
    secondsToTime(seconds) {
        let date = new Date(0);
        date.setSeconds(parseInt(seconds)); // specify value for SECONDS here
        let timeString = date.toISOString().substr(11, 8);
        return timeString
    }
    ////Update instructions
    updateInputStatus(newInput, response) {
        this.platform.log.debug(`Response: ${this.commandName(response)}`);
        this.newInputState(newInput);
    }
    turnOffAll() {
        this.newPowerState(false);
        this.newPlayBackState([false, false, false]);
        this.newInputState([false, false, false, false, false, false]);
        this.mediaDetailsReset();
        this.moviePlaying = false;
        this.musicPlaying = false;
        this.newVolumeStatus(0);
    }
    mediaDetailsReset() {
        this.platform.log.debug("Reset details");
        this.showState = false;
        this.movieRemaining = 0;
        this.movieElapsed = 0;
        this.newMovieTime(0);
        this.newAudioFormat('Audio Information');
        this.newInputName('Media Title');
        this.newInputDuration('Runtime');
        this.newSubtitle('Additional Information');
        this.newVideoFormat('Video Information');
        this.newLanguage('Audio Language');

    }

}