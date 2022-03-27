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
        accessory.category = this.api.hap.Accessory.Categories.TELEVISION;
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
        this.currentMuteState = true;
        this.inputID = 1;
        this.mediaState = 4;
        this.videoState = false;
        this.audioState = false;
        this.inputName = 'Media Name';
        this.mediaDuration = 'Runtime';
        this.mediaElapse = 'Elapsed Time';
        this.mediaVideoFormat = 'Video Format';
        this.mediaAudioFormat = 'Audio Format';
        this.language = 'Audio Language';
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
        this.config.ip = platform.config.ip;
        this.config.manufacturer = platform.config.manufacturer || 'Zidoo';
        this.config.pollingInterval = platform.config.pollingInterval || 1000;
        this.config.modelName = platform.config.modelName || 'Z9x';
        this.config.serialN = platform.config.serialN || 'B210U71647033894';
        this.config.mac = platform.config.mac || 'CA:TA:NI:CO:GA:TA';
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

        ////Checking if the necessary information was given by the user////////////////////////////////////////////////////
        try {
            if (!this.config.ip) {
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
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Set Zidoo Active to: ' + newValue);
                if (newValue === 1) {
                    this.WakeupOnLAN();
                    // this.sending([this.pressedButton('POWER ON')]);
                }
                else {
                    this.sending([this.pressedButton('POWER OFF')]);
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
                        this.platform.log.debug('set Remote Key Pressed: INFORMATION');
                        this.sending([this.pressedButton('INFO')]);
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
                if (inputIdentifier === 999999) {
                    this.newInputState([false, false, false, false, false, false]);
                }
                if (inputIdentifier === 0) {
                    this.newInputState([false, false, false, false, false, false]);
                }
                else if (inputIdentifier === 1) {
                    this.inputID = 1;
                }
                else if (inputIdentifier === 2) {
                    this.inputID = 2;
                }
                else if (inputIdentifier === 3) {
                    this.inputID = 3;
                }
                else if (inputIdentifier === 4) {
                    this.inputID = 4;
                }
                else if (inputIdentifier === 5) {
                    this.inputID = 5;
                }
                else if (inputIdentifier === 6) {
                    this.inputID = 6;
                }
                else {
                    //
                }
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
                    this.sending([this.pressedButton('POP-UP MENU')]);
                }
                else {
                    this.sending([this.pressedButton('POP-UP MENU')]);
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
            this.accessory.addService(this.platform.Service.InputSource, 'Elapsed Time', 'CataNicoGaTa-1005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 3)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, false ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, false ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaElapse;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoAudioElapseTime);
        this.videoFormat = this.accessory.getService('Video Format') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Video Format', 'CataNicoGaTa-4005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 4)
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
            this.accessory.addService(this.platform.Service.InputSource, 'Audio Format', 'CataNicoGaTa-4006')
                .setCharacteristic(this.platform.Characteristic.Identifier, 5)
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
                .setCharacteristic(this.platform.Characteristic.Identifier, 6)
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
                this.sending([this.pressedButton('MUTE')]);
                this.platform.log.debug('Volume Value set to: Mute');

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
        /////Video/Movie Controls/////////////////////////////////////////////////////////////////////
        if (this.config.movieControl === true) {
            this.movieControlL = this.accessory.getService('Media Progress') ||
                this.accessory.addService(this.platform.Service.Lightbulb, 'Media Progress', 'CataNicoGaTa-301');
            this.movieControlL.setCharacteristic(this.platform.Characteristic.Name, 'Media Progress');
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
                    let newSendValue = Math.round(newValue * (this.movieRemaining) / 100);
                    let totalMovieTime = this.movieRemaining;
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
        /////////////Addtional Services////////////////////////////////////////////////////////////////////////////////////
        if (this.config.powerB === true) {
            this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
            this.service.setCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.zidooDisplayName} Power Switch`);
            this.service.updateCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.zidooDisplayName} Power Switch`);
            this.service.getCharacteristic(this.platform.Characteristic.On)
                .on('set', this.setOn.bind(this))
                .on('get', this.getOn.bind(this));
        };
        this.play = this.accessory.getService('Play') ||
            this.accessory.addService(this.platform.Service.Switch, 'Play', 'CataNicoGaTa-10');
        this.play.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.playSwitchStateGet.bind(this))
            .on('set', this.playSwitchStateSet.bind(this));
        this.pause = this.accessory.getService('Pause') ||
            this.accessory.addService(this.platform.Service.Switch, 'Pause', 'CataNicoGaTa-11');
        this.pause.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.pauseSwitchStateGet.bind(this))
            .on('set', this.pauseSwitchStateSet.bind(this));
        this.stop = this.accessory.getService('Stop') ||
            this.accessory.addService(this.platform.Service.Switch, 'Stop', 'CataNicoGaTa-12');
        this.stop.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.stopSwitchStateGet.bind(this))
            .on('set', this.stopSwitchStateSet.bind(this));
        ///////////////////////////////////Input buttons//////////////////////////////////////////////////////////////////////////

        ////other Controls /////////////////////////////////////////////////////////
        if (this.config.cursorUpB === true) {
            this.cursorUp = this.accessory.getService('Cursor Up') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Up', 'CataNicoGaTa-31');
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

        ///////////////Clean up. Delete services not in used////////////////////////////////

        if (this.config.powerB === false) {
            this.accessory.removeService(this.service);
        }
        if (this.config.movieControl === false) {
            this.accessory.removeService(this.movieControlL);
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
        //////////////////Connecting to Zidoo
        // this.udpServer();
        //syncing////////////////////////////////////////////////////////////////////////////////////////
        setInterval(() => {
            if (this.turnOffCommand === false) {
                this.sending([this.query('MUSIC STATUS')]);
                setTimeout(() => {
                    this.sending([this.query('GET MODEL INFO')]);

                }, 250);
                setTimeout(() => {
                    this.sending([this.query('PLAYBACK STATUS')]);


                }, 500);
                if (this.httpNotResponding >= this.reconnectionTry) {
                    this.turnOffAll();
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
                if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
                    this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
                }
                if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                    this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                }
                if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                    this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                }
                if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.inputName) {
                    this.platform.log.debug('Updating Title');
                    // this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
                    this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                }
                if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                    this.platform.log.debug('Updating Runtime');
                    this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
                    //this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
                }
                if (this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaVideoFormat) {
                    this.platform.log.debug('Updating Video Format');
                    //  this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaVideoFormat);
                    this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
                }
                if (this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaAudioFormat) {
                    this.platform.log.debug('Updating Audio Format');
                    //this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                    this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                }
                if (this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.language) {
                    this.platform.log.debug('Updating Language');
                    // this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.language);
                    this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                }

                //this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaElapse);
                //this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse);
            }
            else {
                setTimeout(() => {
                    this.turnOffCommand = false;

                }, 60000);
            }

        }, this.config.pollingInterval);
    }

    ///////////////Wake up/////
    WakeupOnLAN() {

        WOL.wake(this.config.mac, (err) => {
            if (err) {
                this.platform.log(`Could not wake up ${this.config.name}: ${err}`);
                this.newPowerState(false);
                return;
            }
            this.platform.log(`${this.config.name} woke up!`);
            this.newPowerState(true);
            this.turnOffCommand = true;
            setTimeout(() => {
                if (this.powerState === false) {
                    this.platform.log(`Startup time of 60 expired, reverting state to offline`);
                }
            }, 60000);
        });
    }
    /////

    ///////Handlers////////////////////////////////////////////////////////////////////////////////////////
    setOn(value, callback) {
        let zidooState = value;
        if (zidooState === true) {
            this.WakeupOnLAN();
            /*
                this.sending([this.query('GET MODEL INFO')]);
                this.sending([this.query('PLAYBACK STATUS')]);
                this.sending([this.query('MUSIC STATUS')]);
                this.sending([this.pressedButton('POWER ON')]);
                */
        }
        else {

            this.sending([this.pressedButton('POWER OFF')]);
            this.turnOffAll();
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
        if (commandPress.includes('getModel') || commandPress.includes('getState') || commandPress.includes('getPlayStatus')) {
            this.platform.log.debug(`Sending: ${this.commandName(commandPress)} Command`);
        }
        else {
            this.platform.log(`Sending: ${this.commandName(commandPress)} Command`);
        }
    }

    ///////Send HTTP command///////////////////////////
    sending(url) {
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
        else {
            let key1 = url.split('=');
            key = key1[1];
        }
        this.commandLog(key);
        this.platform.log.debug(url);
        this.platform.log.debug(key);
        this.httpNotResponding += 1;
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
                    //console.error(e.message);
                }
            });
        }).on('error', (e) => {
            // console.error(`Got error: ${e.message}`);
        });
    }

    //////////Current Status//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    newAudioStatus(audio) {
        this.platform.log.debug(audio);
        let thisAudio = '';
        if (audio.includes('Digital Plus')) {
            thisAudio = 'Dolby Digital Plus';
        }
        else if (audio.includes('Dolby Digital')) {
            thisAudio = 'Dolby Digital';
        }
        else if (audio.includes('TrueHD')) {
            thisAudio = 'Dolby TrueHD-Atmos';
        }
        else if (audio.includes('DTS-HD High')) {
            thisAudiot = 'DTS-HD High Resolution';
        }
        else if (audio.includes('DTS-HD Master')) {
            thisAudiot = 'DTS-HD MA- DTSX';
        }
        else if (audio.includes('DTS')) {
            thisAudio = 'DTS';
        }
        else if (audio.includes('LPCM')) {
            thisAudio = 'LPCM';

        }
        else if (audio.includes('MPEG')) {
            thisAudio = 'MPEG Audio';

        }
        else if (audio.includes('CD Audio')) {
            thisAudio = 'CD Audio';

        }
        else {
            thisAudio = 'Unknown';

        }

        this.newAudioFormat(thisAudio);
    }
    rightVideoFormat(videoFormat, fps) {
        if (videoFormat.includes('DV')) {
            videoFormat = 'Dolby Vision';
        }
        else if (videoFormat.includes("HLG")) {
            videoFormat = 'HLG';
        }
        else if (!videoFormat.includes('HDR')) {
            videoFormat = 'SDR';
        }
        else {
            videoFormat = videoFormat;
        }
        this.platform.log.debug(videoFormat + " " + fps + "fps");
        this.newVideoFormat(videoFormat + " " + fps + "fps");
    }
    newInputName(newName) {
        if (this.inputName !== newName) {
            this.platform.log.debug(newName);
            this.inputName = newName;
            this.platform.log.debug(this.inputName);
            this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
            // this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
        }
    }
    newInputDuration(newDuration) {

        if (this.mediaDuration !== newDuration) {
            this.platform.log.debug(newDuration);
            this.mediaDuration = newDuration;
            this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
            // this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
        }

    }
    newVideoFormat(videoFormat) {
        this.platform.log.debug(videoFormat);
        if (this.mediaVideoFormat !== videoFormat) {
            this.platform.log.debug(videoFormat);
            this.mediaVideoFormat = videoFormat;
            this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
            this.videoFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.videoFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
    }
    newElapsedTime(elapsedTime) {
        /*
        this.platform.log.debug(elapsedTime);
        if (this.mediaElapse !== elapsedTime) {
            this.mediaElapse = elapsedTime;
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
        */
    }
    newAudioFormat(audioType) {
        this.platform.log.debug(audioType);
        if (this.mediaAudioFormat !== audioType) {
            this.mediaAudioFormat = audioType;
            this.platform.log.debug(audioType);
            this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
            this.audioFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.audioFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
    }
    newLanguage(lang) {
        this.platform.log.debug(lang);
        if (this.language !== lang) {
            this.language = lang;
            this.platform.log.debug(lang);
            this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
            this.audioLanguage.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
            this.audioLanguage.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
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
            this.movieControlL.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentMovieProgress);
            // this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentMovieProgress);
            this.movieControlL.updateCharacteristic(this.platform.Characteristic.On, this.currentMovieProgressState);
            // this.movieControlL.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentMovieProgressState);
        }
    }
    newPowerState(newValue) {
        if (newValue === true) {
            this.powerStateTV = 1;
        }
        else {
            this.powerStateTV = 0;
        }
        if (this.powerSate !== newValue) {
            this.powerState = newValue;
            this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
            this.tvService.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.powerStateTV);
            if (this.config.powerB === true) {
                this.service.updateCharacteristic(this.platform.Characteristic.On, this.powerState);
                this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.powerState);
            }
        }
    }
    newPlayBackState(newPlay) {
        this.playBackState = newPlay;
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
        if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
            this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
            // this.play.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[0]);
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
            // this.stop.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[2]);
            this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
            //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
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
            if (key.includes('getModel') || key.includes('getState') || key.includes('getPlayStatus')) {
                this.platform.log.debug(`Response: ${this.commandName(key)} Command Executed`);
            }
            else {
                this.platform.log(`Response: ${this.commandName(key)} Command Executed`);
            }
            if (key.includes('Power')) {
                this.turnOffCommand = true;
                this.turnOffAll();

            }
            if (key.includes('MediaPlay')) {
                if (key.includes('MediaPlay.Pause')) {
                }
                else {
                    this.newPlayBackState([true, false, false]);
                }
            }
            if (key.includes('MediaStop')) {
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            if (key.includes('MediaPasue')) {
                this.newPlayBackState([false, true, false]);

            }
            if (key.includes('getModel')) {
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
                    this.platform.log.debug("Movie details")
                    this.platform.log.debug(rawData);
                    //////////////////////Media Name///////////////////////////////
                    if (rawData.video.title === 'AVCHD') {
                        let newNameInput = rawData.video.path.split('/');
                        let nameInput = '';
                        if (Object.values(newNameInput)[Object.keys(newNameInput).length - 1] === 'AVCHD') {
                            nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 2];
                            this.newInputName(nameInput);
                        }
                        else {
                            this.newInputName(rawData.video.title);
                        }
                    }
                    else {
                        this.newInputName(rawData.video.title);
                    }
                    //////////Media runtime////////////////////
                    this.movieRemaining = parseInt(rawData.video.duration);
                    let runtimeNumber = this.secondsToTime(parseInt(rawData.video.duration) / 1000);
                    if (runtimeNumber.startsWith('0')) {
                        runtimeNumber = runtimeNumber.substring(1);
                    }
                    this.newInputDuration(runtimeNumber);
                    //////////////////Media Current position
                    this.newMovieTime(parseInt(rawData.video.currentPosition));
                    ////////////////////Media elapsed time////////////////////////////
                    let elapsedRuntimeNumber = this.secondsToTime(parseInt(rawData.video.currentPosition) / 1000);
                    if (elapsedRuntimeNumber.startsWith('0')) {
                        elapsedRuntimeNumber = elapsedRuntimeNumber.substring(1);
                        this.newElapsedTime(elapsedRuntimeNumber);
                    }
                    else {
                        this.newElapsedTime(elapsedRuntimeNumber);
                    }
                    //////////////Video format////////////////////////
                    let videoOutput = rawData.video.output.split(' ');
                    this.platform.log.debug(videoOutput);
                    this.platform.log.debug(Object.values(videoOutput)[Object.keys(videoOutput).length - 1]);

                    this.rightVideoFormat(Object.values(videoOutput)[Object.keys(videoOutput).length - 1], Math.round(rawData.video.fps * 1000) / 1000);

                    ///////////////Audio format
                    this.platform.log.debug(rawData.audio.information);
                    this.newAudioStatus(rawData.audio.information);
                    //////////Audio Lnaguage
                    let languageOutput = rawData.audio.information.split(' ');
                    this.platform.log.debug(Object.values(languageOutput)[0]);
                    this.newLanguage(Object.values(languageOutput)[0]);
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
            if (rawData.state === 4) {
                this.newPlayBackState([false, true, false]);
                this.showState = true;
                this.musicPlaying = true;
            }
            if (rawData.state === 0 && this.moviePlaying === false) {
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            if (rawData.state === 0) {
                this.musicPlaying = false;
            }
            if (rawData.state !== 0) {
                if (this.turnOffCommand !== true) {
                    this.newPowerState(true);
                }
                this.platform.log.debug("Music details")
                this.platform.log.debug(rawData);
                ////////Playback Status
                //////////////////////Media Name///////////////////////////////
                let songTitle = rawData.playingMusic.artist + " - " + rawData.playingMusic.title
                /// this.platform.log(songTitle.length)
                if (songTitle.length >= 64) {
                    this.newInputName(songTitle.slice(0, 61) + "...")
                }
                else {
                    this.newInputName(rawData.playingMusic.artist + " - " + rawData.playingMusic.title);
                }

                //////////Media runtime////////////////////
                this.movieRemaining = parseInt(rawData.duration);
                let runtimeNumber = this.secondsToTime(parseInt(rawData.duration) / 1000);
                if (runtimeNumber.startsWith('0')) {
                    runtimeNumber = runtimeNumber.substring(1);
                }

                this.newInputDuration(runtimeNumber);
                //////////////////Media Current position
                this.newMovieTime(parseInt(rawData.position));
                ////////////////////Media elapsed time////////////////////////////
                let elapsedRuntimeNumber = this.secondsToTime(parseInt(rawData.position) / 1000);
                if (elapsedRuntimeNumber.startsWith('0')) {
                    elapsedRuntimeNumber = elapsedRuntimeNumber.substring(1);
                    this.newElapsedTime(elapsedRuntimeNumber);
                }
                else {
                    this.newElapsedTime(elapsedRuntimeNumber);
                }
                //////////////Audio format////////////////////////

                this.newVideoFormat(rawData.playingMusic.extension);

                ///////////////Audio Bitrate
                this.newAudioFormat(rawData.playingMusic.bitrate);

                //////////Audio file size
                this.newLanguage(rawData.playingMusic.fileSize);

            }
            else {

            }

        }
        else {

        }


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

    }
    mediaDetailsReset() {
        this.platform.log.debug("Reset details");
        this.showState = false;
        this.movieRemaining = 0;
        this.newMovieTime(0);
        this.newAudioFormat('Audio Format');
        this.newInputName('Media Title');
        this.newInputDuration('Runtime');
        this.newElapsedTime('Elapsed Time');
        this.newVideoFormat('Video Format');
        this.newLanguage('Audio Language');

    }
    udpServer() {

        this.server = udp.createSocket('udp4');
        this.server.on('error', (error) => {
            this.platform.log(error);
            this.server.close();
        });
        // emits on new datagram msg
        this.server.on('message', (msg, info) => {
            this.platform.log('Data received from client : ' + msg.toString());
            this.platform.log('Received %d bytes from %s:%d', msg.length, info.address, info.port);

        });
        //emits when socket is ready and listening for datagram msgs
        this.server.on('listening', () => {
            let address = this.server.address();
            let port = address.port;
            let family = address.family;
            let ipaddr = address.address;
            this.server.setBroadcast(true);
            this.server.setMulticastTTL(128);
            this.server.addMembership('239.39.3.9');
            this.platform.log('Server is listening at port ' + port);
            this.platform.log('Server ip ' + ipaddr);
            this.platform.log('Server is IP4/IP6 : ' + family);
        });
        this.server.bind(18239, '192.168.86.25')
        //emits after the socket is closed using socket.close();
        this.server.on('close', () => {
            this.platform.log('Socket is closed !');
        });

        //this.server.bind(1900, '239.255.255.250');

    }
}