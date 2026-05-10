"use strict";
const PLATFORM_NAME = 'zidooPlugin';
const PLUGIN_NAME = 'homebridge-zidoo-androidtv';
const WOL = require('wol');
const request = require('http');
const udp = require('dgram');
const STATELESS_SWITCH_CONFIGS = [
    { configKey: 'cursorUpB', propertyName: 'cursorUp', serviceName: 'Cursor Up', uniqueId: 'CataNicoGaTa-31', commandName: 'CURSOR UP' },
    { configKey: 'cursorDownB', propertyName: 'cursorDown', serviceName: 'Cursor Down', uniqueId: 'CataNicoGaTa-32', commandName: 'CURSOR DOWN' },
    { configKey: 'cursorLeftB', propertyName: 'cursorLeft', serviceName: 'Cursor Left', uniqueId: 'CataNicoGaTa-33', commandName: 'CURSOR LEFT' },
    { configKey: 'cursorRightB', propertyName: 'cursorRight', serviceName: 'Cursor Right', uniqueId: 'CataNicoGaTa-34', commandName: 'CURSOR RIGHT' },
    { configKey: 'cursorEnterB', propertyName: 'cursorEnter', serviceName: 'Cursor Enter', uniqueId: 'CataNicoGaTa-35', commandName: 'CURSOR ENTER' },
    { configKey: 'menuB', propertyName: 'menu', serviceName: 'Menu', uniqueId: 'CataNicoGaTa-36', commandName: 'MENU' },
    { configKey: 'backButtonB', propertyName: 'backButton', serviceName: 'Back', uniqueId: 'CataNicoGaTa-37', commandName: 'BACK' },
    { configKey: 'homeMenuB', propertyName: 'homeMenu', serviceName: 'Home Menu', uniqueId: 'CataNicoGaTa-43', commandName: 'HOME MENU' },
    { configKey: 'infoB', propertyName: 'infoButton', serviceName: 'Info', uniqueId: 'CataNicoGaTa-44', commandName: 'INFO' },
    { configKey: 'pageUpB', propertyName: 'pageUp', serviceName: 'Page Up', uniqueId: 'CataNicoGaTa-50', commandName: 'PAGE UP' },
    { configKey: 'pageDownB', propertyName: 'pageDown', serviceName: 'Page Down', uniqueId: 'CataNicoGaTa-51', commandName: 'PAGE DOWN' },
    { configKey: 'popUpMenuB', propertyName: 'popUpMenu', serviceName: 'Pop-Up Menu', uniqueId: 'CataNicoGaTa-52', commandName: 'POP-UP MENU' },
    { configKey: 'mediaButtons', propertyName: 'previous', serviceName: 'Previous', uniqueId: 'CataNicoGaTa-38', commandName: 'PREVIOUS' },
    { configKey: 'mediaButtons', propertyName: 'next', serviceName: 'Next', uniqueId: 'CataNicoGaTa-39', commandName: 'NEXT' },
    { configKey: 'mediaButtons', propertyName: 'rewindButton', serviceName: 'Rewind', uniqueId: 'CataNicoGaTa-46', commandName: 'REWIND' },
    { configKey: 'mediaButtons', propertyName: 'forwardButton', serviceName: 'Forward', uniqueId: 'CataNicoGaTa-80', commandName: 'FORWARD' },
    { configKey: 'redB', propertyName: 'red', serviceName: 'Red', uniqueId: 'CataNicoGaTa-53', commandName: 'RED' },
    { configKey: 'greenB', propertyName: 'green', serviceName: 'Green', uniqueId: 'CataNicoGaTa-54', commandName: 'GREEN' },
    { configKey: 'blueB', propertyName: 'blue', serviceName: 'Blue', uniqueId: 'CataNicoGaTa-55', commandName: 'BLUE' },
    { configKey: 'yellowB', propertyName: 'yellow', serviceName: 'Yellow', uniqueId: 'CataNicoGaTa-56', commandName: 'YELLOW' },
    { configKey: 'audioB', propertyName: 'audio', serviceName: 'Audio', uniqueId: 'CataNicoGaTa-57', commandName: 'AUDIO' },
    { configKey: 'subtitleB', propertyName: 'subtitle', serviceName: 'Subtitle', uniqueId: 'CataNicoGaTa-58', commandName: 'SUBTITLE' },
    { configKey: 'repeatB', propertyName: 'repeat', serviceName: 'Repeat', uniqueId: 'CataNicoGaTa-63', commandName: 'REPEAT' },
    { configKey: 'pipB', propertyName: 'pip', serviceName: 'PIP', uniqueId: 'CataNicoGaTa-64', commandName: 'PIP' },
    { configKey: 'resolutionB', propertyName: 'resolution', serviceName: 'Resolution', uniqueId: 'CataNicoGaTa-65', commandName: 'RESOLUTION' },
    { configKey: 'recordB', propertyName: 'record', serviceName: 'Record', uniqueId: 'CataNicoGaTa-9002', commandName: 'RECORD' },
    { configKey: 'movieB', propertyName: 'movie', serviceName: 'Movie', uniqueId: 'CataNicoGaTa-9003', commandName: 'MOVIE' },
    { configKey: 'musicB', propertyName: 'music', serviceName: 'Music', uniqueId: 'CataNicoGaTa-9004', commandName: 'MUSIC' },
    { configKey: 'photoB', propertyName: 'photo', serviceName: 'Photo', uniqueId: 'CataNicoGaTa-9005', commandName: 'PHOTO' },
    { configKey: 'fileB', propertyName: 'file', serviceName: 'File', uniqueId: 'CataNicoGaTa-9006', commandName: 'FILE' },
    { configKey: 'lightB', propertyName: 'light', serviceName: 'Light', uniqueId: 'CataNicoGaTa-9007', commandName: 'LIGHT' },
    { configKey: 'screenshotB', propertyName: 'screenshot', serviceName: 'Screenshot', uniqueId: 'CataNicoGaTa-9008', commandName: 'SCREENSHOT' },
    { configKey: 'appSwitchB', propertyName: 'appSwitch', serviceName: 'App Switch', uniqueId: 'CataNicoGaTa-9009', commandName: 'APPSWITCH' },
    { configKey: 'rebootB', propertyName: 'rebootB', serviceName: 'Reboot', uniqueId: 'CataNicoGaTa-X09', commandName: 'REBOOT' },
];
const COMMAND_NAME_MATCHES = [
    { token: 'Poweroff', label: 'Power Off' },
    { token: 'Standby', label: 'Standby' },
    { token: 'Reboot', label: 'Reboot' },
    { token: 'VolumeUp', label: 'Volume Up' },
    { token: 'VolumeDown', label: 'Volume Down' },
    { token: 'PowerOn', label: 'Power On' },
    { token: 'Up', label: 'Cursor Up' },
    { token: 'Down', label: 'Cursor Down' },
    { token: 'Left', label: 'Cursor Left' },
    { token: 'Right', label: 'Cursor Right' },
    { token: 'Ok', label: 'Enter' },
    { token: 'Menu', label: 'Menu' },
    { token: 'Back', label: 'Back' },
    { token: 'MediaPlay.Pause', label: 'Play/Pause' },
    { token: 'MediaPlay', label: 'Play' },
    { token: 'MediaPause', label: 'Pause' },
    { token: 'MediaStop', label: 'Stop' },
    { token: 'MediaPrev', label: 'Previous Chapter' },
    { token: 'MediaNext', label: 'Next Chapter' },
    { token: 'Home', label: 'Home Menu' },
    { token: 'Info', label: 'Information' },
    { token: 'MediaBackward', label: 'Rewind' },
    { token: 'MediaForward', label: 'Forward' },
    { token: 'PageUP', label: 'Page Up' },
    { token: 'PageDown', label: 'Page Down' },
    { token: 'PopMenu', label: 'Pop-Up Menu' },
    { token: 'UserDefine_A', label: 'Red' },
    { token: 'UserDefine_B', label: 'Green' },
    { token: 'UserDefine_D', label: 'Blue' },
    { token: 'UserDefine_C', label: 'Yellow' },
    { token: 'Audio', label: 'Audio' },
    { token: 'Subtitle', label: 'Subtitle' },
    { token: 'Repeat', label: 'Repeat' },
    { token: 'Pip', label: 'PIP' },
    { token: 'Resolution', label: 'Resolution' },
    { token: 'Mute', label: 'Mute' },
    { token: 'Record', label: 'Record' },
    { token: 'movie', label: 'Movie' },
    { token: 'music', label: 'Music' },
    { token: 'photo', label: 'Photo' },
    { token: 'file', label: 'File' },
    { token: 'light', label: 'Light' },
    { token: 'Screenshot', label: 'Screenshot' },
    { token: 'APP.Switch', label: 'App Switch' },
    { token: 'getModel', label: 'Get Model Information' },
    { token: 'getState', label: 'Music Information' },
    { token: 'getPlayStatus', label: 'Movie Information' },
    { token: 'changeVolume', label: 'Volume Status' },
    { token: 'seek', label: 'Searching' },
];
const BUTTON_KEY_SUFFIXES = {
    'POWER ON': 'PowerOn',
    'REBOOT': 'PowerOn.Reboot',
    'CURSOR UP': 'Up',
    'CURSOR DOWN': 'Down',
    'CURSOR LEFT': 'Left',
    'CURSOR RIGHT': 'Right',
    'CURSOR ENTER': 'Ok',
    'MENU': 'Menu',
    'BACK': 'Back',
    'PLAY': 'MediaPlay',
    'PLAY/PAUSE': 'MediaPlay.Pause',
    'PAUSE': 'MediaPause',
    'STOP': 'MediaStop',
    'PREVIOUS': 'MediaPrev',
    'NEXT': 'MediaNext',
    'HOME MENU': 'Home',
    'INFO': 'Info',
    'REWIND': 'MediaBackward',
    'FORWARD': 'MediaForward',
    'PAGE UP': 'PageUP',
    'PAGE DOWN': 'PageDown',
    'POP-UP MENU': 'PopMenu',
    'RED': 'UserDefine_A',
    'GREEN': 'UserDefine_B',
    'BLUE': 'UserDefine_D',
    'YELLOW': 'UserDefine_C',
    'AUDIO': 'Audio',
    'SUBTITLE': 'Subtitle',
    'REPEAT': 'Repeat',
    'PIP': 'Pip',
    'RESOLUTION': 'Resolution',
    'VOLUME UP': 'VolumeUp',
    'VOLUME DOWN': 'VolumeDown',
    'MUTE': 'Mute',
    'RECORD': 'Record',
    'MOVIE': 'movie',
    'MUSIC': 'music',
    'PHOTO': 'photo',
    'FILE': 'file',
    'LIGHT': 'light',
    'SCREENSHOT': 'Screenshot',
    'APPSWITCH': 'APP.Switch',
};
module.exports = (api) => {
    api.registerPlatform(PLATFORM_NAME, zidooPlatform);
};
//// Platform/////////////////////////////////////////////////////////////////////////////////////////////////
class zidooPlatform {
    // Stores plugin configuration and delays accessory creation until Homebridge is fully launched.
    constructor(log, config, api) {
        if (!config) {
            return;
        }
        this.log = log;
        this.config = config;
        this.api = api;
        if (this.api) {
            this.api.on('didFinishLaunching', this.initDevices.bind(this));
        }
        /*
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
        */

    }
    // Restores cached accessories so Homebridge can reuse persisted metadata on restart.
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }
    // Builds and publishes one external accessory per configured Zidoo device.
    initDevices() {

        this.log.info('Init - initializing devices');

        // read from config.devices
        if (this.config.devices && Array.isArray(this.config.devices)) {
            //this.log.info(this.config.devices.length);
            let deviceNumber = this.config.devices.length;
            let i = 0;
            for (let device of this.config.devices) {
                if (device) {
                    this.config = device
                    this.config.numberOfDevices = deviceNumber;
                    this.Service = this.api.hap.Service;
                    this.Characteristic = this.api.hap.Characteristic;
                    this.config.name = this.config.name || 'Zidoo AndroidTV';
                    this.config.newPlatformUUID = this.config.newPlatformUUID || false;
                    // this is used to track restored cached accessories
                    this.accessories = [];
                    /////
                    if (i === 0) {
                        if (this.config.newPlatformUUID === false) {
                            this.zidooDevice =
                            {
                                zidooUniqueId: 'nicocate',
                                zidooDisplayName: `${this.config.name}`
                            };
                        }
                        else {
                            this.zidooDevice =
                            {
                                zidooUniqueId: `${this.config.name}catanico`,
                                zidooDisplayName: `${this.config.name}`
                            };
                        }
                    }
                    else {
                        if (this.config.newPlatformUUID === false) {
                            this.zidooDevice =
                            {
                                zidooUniqueId: `${i}nicocata`,
                                zidooDisplayName: `${this.config.name}`
                            };
                        }
                        else {
                            this.zidooDevice =
                            {
                                zidooUniqueId: `${i}${this.config.name}catanico`,
                                zidooDisplayName: `${this.config.name}`
                            };
                        }
                    }
                    i += 1;
                    /////////

                    this.log.debug('Generationg a new UUID');
                    const uuid = this.api.hap.uuid.generate(this.zidooDevice.zidooUniqueId);
                    this.log.debug('Adding new accessory:', this.zidooDevice.zidooDisplayName);
                    const accessory = new this.api.platformAccessory(this.zidooDevice.zidooDisplayName, uuid);
                    accessory.category = 35;
                    accessory.context.device = this.zidooDevice;
                    new zidooAccessory(this, accessory);
                    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
                }
            }
        } else if (this.config) {
            this.log.info('The devices property is not of type array. Cannot initialize. Type: %s', typeof this.config.devices);
        }
        if (!this.config) {
            this.log.info('-------------------------------------------');
            this.log.info('Init - No device configuration found');
            this.log.info('Missing devices in your platform config');
            this.log.info('-------------------------------------------');
        }

        /*
        
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
        
        */


    }
    // Removes a published accessory from Homebridge.
    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}
class zidooAccessory {
    // Initializes accessory state, creates HomeKit services, and starts polling/UDP discovery workflows.
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
        this.volumeBeforeMute = 100;
        this.isMute = false;
        this.isMuteAvailable = false;
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
        this.movieDuration = 0;
        ////Connection parameters
        this.reconnectionTry = 2;
        this.standbyMode = 0;
        this.deviceAvailableForPolling = false;
        this.availabilityProbeInFlight = false;
        this.nextAvailabilityProbeAt = 0;
        this.waitingForDeviceAvailability = false;
        this.availabilityProbeIntervalMs = 5000;
        this.managedTimeouts = new Set();
        this.managedIntervals = new Set();
        this.pollInFlight = false;
        // Reuse sockets across requests to reduce TCP handshake overhead.
        this.httpAgent = new request.Agent({ keepAlive: true, maxSockets: 8 });
        //Device Information//////////////////////////////////////////////////////////////////////////////////////
        this.config.name = platform.config.name || 'Zidoo Z9X';
        this.config.manufacturer = platform.config.manufacturer || 'Zidoo';
        this.config.pollingInterval = platform.config.pollingInterval || 1000;
        this.config.modelName = platform.config.modelName || 'Z9X';
        this.config.serialN = platform.config.serialN || 'B210U71647033894';
        this.config.mac = platform.config.mac || 'CA:TA:NI:CO:GA:TA';
        this.config.autoIPMac = platform.config.autoIPMac || false;
        this.config.standby = platform.config.standby || false;
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
        this.config.logDirectory = '/var/lib/homebridge/DeviceStateLogs/';
        this.registerShutdownHandler();
        //this.logInfo(platform.config);
        if (this.config.autoIPMac === false && this.config.numberOfDevices === 1) {
            //this.logInfo('set to false');
            this.config.autoIPMac = true;
        }
        else {
            // this.logInfo('set to true');
            this.config.autoIPMac = false;
        }
        ////Checking if the necessary information was given by the user////////////////////////////////////////////////////
        try {
            if (!this.config.ip && this.config.autoIPMac === false) {
                throw new Error(`Zidoo IP address is required for ${this.config.name}`);
            }
        } catch (error) {
            this.logInfo(error);
            this.logInfo('Failed to create platform device, missing mandatory information!');
            this.logInfo('Please check your device config!');
            return;
        }

        this.setupAccessoryInformationService();
        this.setupTelevisionServices();
        this.setupSpeakerService();
        this.setupOptionalServices(this.accessory);
        this.cleanupDisabledServices();
        this.startConnectivityServices();
        this.startSynchronizationLoops();
    }
    // Applies fallback metadata formatting for firmware responses that omit `video.output`.
    applyBasicVideoMetadata(rawData, videoPayload) {
        const videoHeight = this.toFiniteNumber(videoPayload.height, 0);
        const videoWidth = this.toFiniteNumber(videoPayload.width, 0);
        const framesPerSecond = Math.round(this.toFiniteNumber(videoPayload.fps, 0) * 1000) / 1000;
        const movieAspectRatio = videoWidth + 'x' + videoHeight;
        let movieInfo = '';
        if (videoHeight >= 2160) {
            movieInfo = '4K Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight > 1080) {
            movieInfo = 'UHD Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight === 1080) {
            movieInfo = 'Full HD Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight === 720) {
            movieInfo = 'HD Video (' + movieAspectRatio + ')';
        }
        else {
            movieInfo = 'SD Video (' + movieAspectRatio + ')';
        }
        this.newVideoFormat(this.nameLengthCheck(movieInfo + ' at ' + framesPerSecond + ' Hz'));
        const audioInformation = rawData.audio && typeof rawData.audio.information === 'string' ? rawData.audio.information : 'Unknown';
        const videoAudioInfo = audioInformation.split(" ");
        this.logDebug((videoAudioInfo[1] || 'Unknown') + ' ' + '(' + (videoAudioInfo[0] || 'Unknown') + ')');
        this.newLanguage(this.nameLengthCheck('Audio: ' + (videoAudioInfo[1] || 'Unknown') + ' ' + '(' + (videoAudioInfo[0] || 'Unknown') + ')'));
        let audioText = '';
        for (let i = 2; i < videoAudioInfo.length; i++) {
            audioText += videoAudioInfo[i] + ' ';
        }
        this.newAudioFormat(this.nameLengthCheck('Sound: ' + audioText));
        this.newSubtitle('Additional Information');
        const subtitleInformation = rawData.subtitle && typeof rawData.subtitle.information === 'string' ? rawData.subtitle.information : 'Off';
        const subtitlesOn = subtitleInformation.split(' ');
        this.newSubtitle(this.nameLengthCheck('Subtitles: ' + (subtitlesOn[0] || 'Off')));
    }
    // Applies rich video/audio/subtitle metadata when output detail fields are available in the payload.
    applyDetailedVideoMetadata(rawData, videoPayload) {
        const videoOutput = videoPayload.output.split(' ');
        this.logDebug(videoOutput);
        this.logDebug(videoOutput[videoOutput.length - 1] || '');
        const currentBitrate = typeof videoPayload.bitrate === 'undefined' ? '' : `${videoPayload.bitrate}`;
        const videoHeight = this.toFiniteNumber(videoPayload.height, 0);
        const movieAspectRatio = (videoOutput[0] || '').toLowerCase();
        const movieFileSize = typeof videoPayload.filesize === 'undefined' ? '' : `${videoPayload.filesize}`;
        const framesPerSecond = Math.round(this.toFiniteNumber(videoPayload.fps, 0) * 1000) / 1000;
        let movieInfo = '';
        if (videoHeight >= 2160) {
            movieInfo = '4K Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight > 1080) {
            movieInfo = 'UHD Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight === 1080) {
            movieInfo = 'Full HD Video (' + movieAspectRatio + ')';
        }
        else if (videoHeight === 720) {
            movieInfo = 'HD Video (' + movieAspectRatio + ')';
        }
        else {
            movieInfo = 'SD Video (' + movieAspectRatio + ')';
        }
        let hdrFormat = videoPayload.output;
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
        if (currentBitrate !== '' && currentBitrate !== ' ') {
            this.newVideoFormat(this.nameLengthCheck(hdrFormat + ' ' + movieInfo + ' at ' + framesPerSecond + ' Hz and ' + currentBitrate));
        }
        else {
            this.newVideoFormat(this.nameLengthCheck(hdrFormat + ' ' + movieInfo + ' at ' + framesPerSecond + ' Hz'));
        }
        const audioInformation = rawData.audio && typeof rawData.audio.information === 'string' ? rawData.audio.information : 'Unknown';
        const languageOutput = audioInformation.split(' ');
        const firstLanguageToken = languageOutput[0] || 'Unknown';
        const lastLanguageToken = languageOutput[languageOutput.length - 1] || '';
        this.logDebug(firstLanguageToken + ' ' + lastLanguageToken);
        this.newLanguage(this.nameLengthCheck('Audio: ' + firstLanguageToken + ' ' + lastLanguageToken));
        if (audioInformation.includes(" channel ")) {
            const videoAudioInfo = audioInformation.split(" channel ");
            const videoAudioInfo0 = videoAudioInfo[0].split(' ');
            let audioText = '';
            for (let i = 1; i < videoAudioInfo0.length; i++) {
                audioText += videoAudioInfo0[i] + ' ';
            }
            this.newAudioFormat(this.nameLengthCheck('Sound: ' + audioText + (videoAudioInfo[1] || '')));
        }
        else {
            this.newAudioFormat(this.nameLengthCheck('Sound: ' + audioInformation));
        }
        let subtitlesOn = rawData.subtitle && typeof rawData.subtitle.information === 'string' ? rawData.subtitle.information : 'Off';
        if (subtitlesOn === 'Off') {
            if (movieFileSize !== ' ' && movieFileSize !== '') {
                this.newSubtitle(this.nameLengthCheck('Subtitles: Off' + ' File Size: ' + movieFileSize));
            }
            else {
                this.newSubtitle(this.nameLengthCheck('Subtitles: Off'));
            }
            return;
        }
        const subtitleParts = subtitlesOn.split(' ');
        let subtitleFirstPart = subtitleParts[0] || '';
        if (subtitleFirstPart.includes('(')) {
            subtitleFirstPart = subtitleFirstPart.split('(')[0];
        }
        const subtitleLastPart = subtitleParts[subtitleParts.length - 1] || '';
        if (movieFileSize !== ' ' && movieFileSize !== '') {
            this.newSubtitle(this.nameLengthCheck('Subtitles: ' + subtitleFirstPart + ' ' + subtitleLastPart + ', File Size: ' + movieFileSize));
        }
        else {
            this.newSubtitle(this.nameLengthCheck('Subtitles: ' + subtitleFirstPart + ' ' + subtitleLastPart));
        }
    }
    // Applies volume updates from a status payload and tolerates known firmware field-name variations.
    applyVolumePayload(rawData) {
        const maxVolume = this.toFiniteNumber(rawData.maxVolume, 0);
        const currentVolumeRaw = typeof rawData.currentVolume !== 'undefined' ? rawData.currentVolume : rawData.currenttVolume;
        const currentVolume = this.toFiniteNumber(currentVolumeRaw, NaN);
        if (maxVolume > 0 && Number.isFinite(currentVolume)) {
            this.maxVolume = maxVolume;
            const normalizedVolume = Math.round((currentVolume / maxVolume) * 100);
            this.newVolumeStatus(normalizedVolume);
            return;
        }
        this.logDebug('Skipping volume update because payload is missing valid volume values.');
    }
    // Builds a Lightbulb/Fanv2 range control with shared get/set behavior for state and percentage value.
    buildDualModeRangeService({
        serviceName,
        lightPropertyName,
        fanPropertyName,
        lightUniqueId,
        fanUniqueId,
        stateGetter,
        onStateSet,
        valueGetter,
        onValueSet,
        setNameCharacteristic = false,
    }) {
        const usesFanMode = this.config.changeDimmersToFan === true;
        const propertyName = usesFanMode ? fanPropertyName : lightPropertyName;
        const serviceType = usesFanMode ? this.platform.Service.Fanv2 : this.platform.Service.Lightbulb;
        const uniqueId = usesFanMode ? fanUniqueId : lightUniqueId;
        const stateCharacteristic = usesFanMode ? this.platform.Characteristic.Active : this.platform.Characteristic.On;
        const valueCharacteristic = usesFanMode ? this.platform.Characteristic.RotationSpeed : this.platform.Characteristic.Brightness;
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(serviceType, serviceName, uniqueId);
        if (setNameCharacteristic === true) {
            service.setCharacteristic(this.platform.Characteristic.Name, serviceName);
        }
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(stateCharacteristic)
            .on('get', (callback) => {
                const currentState = stateGetter();
                if (usesFanMode) {
                    callback(null, currentState === true ? 1 : 0);
                    return;
                }
                callback(null, currentState);
            })
            .on('set', (newValue, callback) => {
                onStateSet(newValue, usesFanMode);
                callback(null);
            });
        service.getCharacteristic(valueCharacteristic)
            .on('get', (callback) => {
                callback(null, valueGetter());
            })
            .on('set', (newValue, callback) => {
                onValueSet(newValue, usesFanMode);
                callback(null);
            });
        this[propertyName] = service;
        return service;
    }
    // Declares all TV input sources in one place and builds/links each service from a definition object.
    buildInputSources() {
        const currentShown = this.platform.Characteristic.CurrentVisibilityState.SHOWN;
        const currentHidden = this.platform.Characteristic.CurrentVisibilityState.HIDDEN;
        const targetShown = this.platform.Characteristic.TargetVisibilityState.SHOWN;
        const targetHidden = this.platform.Characteristic.TargetVisibilityState.HIDDEN;
        const showMediaDetails = this.showState ? currentShown : currentHidden;
        const showMediaDetailsTarget = this.showState ? targetShown : targetHidden;
        const inputSourceDefinitions = [
            {
                propertyName: 'videoAudioTitle',
                serviceName: 'Media Title',
                uniqueId: 'CataNicoGaTa-1003',
                identifier: 1,
                configuredName: () => this.inputName,
                inputSourceType: this.platform.Characteristic.InputSourceType.APPLICATION,
                currentVisibility: currentShown,
                onGet: () => this.inputName,
                logOnGet: true,
            },
            {
                propertyName: 'runtime',
                serviceName: 'Runtime',
                uniqueId: 'CataNicoGaTa-1004',
                identifier: 2,
                configuredName: () => this.mediaDuration,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                currentVisibility: currentShown,
                onGet: () => this.mediaDuration,
                logOnGet: true,
            },
            {
                propertyName: 'videoAudioElapseTime',
                serviceName: 'Additional Information',
                existingServiceName: 'Elapsed Time',
                uniqueId: 'CataNicoGaTa-1005',
                identifier: 6,
                configuredName: () => this.subtitleInfo,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: targetHidden,
                currentVisibility: currentHidden,
                onGet: () => this.subtitleInfo,
                logOnGet: true,
            },
            {
                propertyName: 'videoFormat',
                serviceName: 'Video Information',
                existingServiceName: 'Video Format',
                uniqueId: 'CataNicoGaTa-4005',
                identifier: 3,
                configuredName: () => this.mediaVideoFormat,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.mediaVideoFormat,
                logOnGet: true,
            },
            {
                propertyName: 'audioFormat',
                serviceName: 'Audio Information',
                existingServiceName: 'Audio Format',
                uniqueId: 'CataNicoGaTa-4006',
                identifier: 4,
                configuredName: () => this.mediaAudioFormat,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.mediaAudioFormat,
                logOnGet: true,
            },
            {
                propertyName: 'audioLanguage',
                serviceName: 'Audio Language',
                uniqueId: 'CataNicoGaTa-4007',
                identifier: 5,
                configuredName: () => this.language,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.language,
                logOnGet: true,
            },
        ];
        for (const definition of inputSourceDefinitions) {
            this.getOrCreateInputSource(definition);
        }
    }
    // Builds the optional media-progress control as a dimmer or fan based on configuration.
    buildMovieProgressService() {
        this.buildDualModeRangeService({
            serviceName: 'Media Progress',
            lightPropertyName: 'movieControlL',
            fanPropertyName: 'movieControlF',
            lightUniqueId: 'CataNicoGaTa-301',
            fanUniqueId: 'CataNicoGaTa-301F',
            setNameCharacteristic: true,
            stateGetter: () => this.currentMovieProgressState,
            onStateSet: (newValue) => {
                this.logInfo('Movie progress state set to: ' + newValue);
            },
            valueGetter: () => this.currentMovieProgress,
            onValueSet: (newValue) => {
                this.setMovieSeekPositionFromPercent(newValue);
                this.logInfo('Movie progress set to: ' + newValue + '%');
            },
        });
    }
    // Builds all optional stateless switches using one shared definition table.
    buildStatelessSwitches() {
        for (const definition of this.getStatelessSwitchConfigs()) {
            if (this.config[definition.configKey] === true) {
                this.createStatelessSwitch(definition);
            }
        }
    }
    // Builds the optional Zidoo volume dimmer/fan control using one dual-mode service helper.
    buildVolumeControlService() {
        this.buildDualModeRangeService({
            serviceName: 'Zidoo Volume',
            lightPropertyName: 'volumeDimmer',
            fanPropertyName: 'volumeFan',
            lightUniqueId: 'CataNicoGaT-98Z',
            fanUniqueId: 'CataNicoGaT-98FZ',
            stateGetter: () => this.currentVolumeSwitch,
            onStateSet: (newValue, usesFanMode) => {
                this.logDebug('Volume Value set to: Mute/Unmute');
                const isActive = usesFanMode ? newValue === 1 : newValue === true;
                if (!isActive) {
                    this.volumeBeforeMute = this.currentVolume;
                    if (this.currentVolume !== 0) {
                        this.volumeChange(0);
                    }
                    return;
                }
                if (this.volumeBeforeMute === 0) {
                    this.volumeChange(100);
                    return;
                }
                this.volumeChange(this.volumeBeforeMute);
            },
            valueGetter: () => this.currentVolume,
            onValueSet: (newValue) => {
                this.volumeChange(newValue);
                this.logInfo('Volume Value set to: ' + newValue + '%');
            },
        });
    }
    // Removes optional services that are disabled in config so HomeKit only shows active features.
    cleanupDisabledServices() {
        if (this.config.remainMovieTimer === false) {
            this.safeRemoveService(this.movieTimer);
        }
        if (this.config.removePlayback === true) {
            this.safeRemoveService(this.play);
            this.safeRemoveService(this.stop);
            this.safeRemoveService(this.pause);
        }
        if (this.config.powerB === false) {
            this.safeRemoveService(this.service);
        }
        if (this.config.movieControl === false) {
            this.safeRemoveService(this.movieControlL);
            this.safeRemoveService(this.movieControlF);
        }
        this.cleanupDisabledStatelessSwitches();
        if (this.config.muteB === false) {
            this.safeRemoveService(this.mute);
        }
        if (this.config.changeDimmersToFan === false) {
            this.safeRemoveService(this.volumeFan);
            this.safeRemoveService(this.movieControlF);
        }
        if (this.config.changeDimmersToFan === true) {
            this.safeRemoveService(this.movieControlL);
            this.safeRemoveService(this.volumeDimmer);
        }
        if (this.config.volume === false) {
            this.safeRemoveService(this.volumeDimmer);
            this.safeRemoveService(this.volumeFan);
        }
    }
    // Removes disabled stateless switches so HomeKit only exposes features enabled in config.
    cleanupDisabledStatelessSwitches() {
        for (const definition of this.getStatelessSwitchConfigs()) {
            if (this.config[definition.configKey] !== true) {
                const service = this[definition.propertyName] || this.accessory.getService(definition.serviceName);
                this.safeRemoveService(service);
            }
        }
    }
    // Clears all tracked interval/timeout handles to avoid orphan timers.
    clearManagedTimers() {
        for (const timeoutHandle of this.managedTimeouts) {
            clearTimeout(timeoutHandle);
        }
        this.managedTimeouts.clear();
        for (const intervalHandle of this.managedIntervals) {
            clearInterval(intervalHandle);
        }
        this.managedIntervals.clear();
    }
    /////////////////Command Log
    // Keeps polling commands in debug logs while elevating user-triggered commands to info logs.
    commandLog(commandPress) {
        if (commandPress.includes('getModel') || commandPress.includes('getState') || commandPress.includes('getPlayStatus') || commandPress.includes('volumeStatus')) {
            this.logDebug(`Sending: ${this.commandName(commandPress)} Command`);
        }
        else {
            this.logInfo(`Sending: ${this.commandName(commandPress)} Command`);
        }
    }
    //////////Sending Command Name Decoder///////////
    // Converts raw Zidoo command tokens into readable labels for logs and history.
    commandName(keyS) {
        this.logDebug(keyS);
        for (const mapping of COMMAND_NAME_MATCHES) {
            if (keyS.includes(mapping.token)) {
                return mapping.label;
            }
        }
        return keyS;
    }
    // Creates a new HomeKit InputSource service and applies all static characteristics from its definition.
    createInputSourceService({
        serviceName,
        uniqueId,
        identifier,
        configuredName,
        inputSourceType,
        targetVisibility,
        currentVisibility,
    }) {
        const configuredNameValue = typeof configuredName === 'function' ? configuredName() : configuredName;
        const service = this.accessory.addService(this.platform.Service.InputSource, serviceName, uniqueId)
            .setCharacteristic(this.platform.Characteristic.Identifier, identifier)
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, configuredNameValue)
            .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(this.platform.Characteristic.InputSourceType, inputSourceType);
        if (typeof targetVisibility !== 'undefined') {
            service.setCharacteristic(this.platform.Characteristic.TargetVisibilityState, targetVisibility);
        }
        if (typeof currentVisibility !== 'undefined') {
            service.setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, currentVisibility);
        }
        return service;
    }
    // Creates a persistent stateful switch where get/set behavior is provided by bound handlers.
    createStatefulSwitch({ propertyName, serviceName, uniqueId, onGet, onSet }) {
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(this.platform.Service.Switch, serviceName, uniqueId);
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(this.platform.Characteristic.On)
            .on('get', onGet)
            .on('set', onSet);
        this[propertyName] = service;
        return service;
    }
    // Creates a stateless switch that sends one remote command and auto-resets back to off.
    createStatelessSwitch({ propertyName, serviceName, uniqueId, commandName }) {
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(this.platform.Service.Switch, serviceName, uniqueId);
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(this.platform.Characteristic.On)
            .on('get', (callback) => {
                this.logDebug(`${serviceName} GET On`);
                callback(null, false);
            })
            .on('set', (value, callback) => {
                this.logDebug(`${serviceName} SET On: ${value}`);
                if (value === true) {
                    this.sending([this.pressedButton(commandName)]);
                }
                this.scheduleTimeout(() => {
                    service.updateCharacteristic(this.platform.Characteristic.On, false);
                }, this.statelessTimeOut);
                callback(null);
            });
        this[propertyName] = service;
        return service;
    }
    // Resolves after the specified delay using managed timeout tracking for clean shutdown support.
    delayByMs(delayMs) {
        return new Promise((resolve) => {
            this.scheduleTimeout(() => resolve(), delayMs);
        });
    }
    ////////////////Zidoo discovery
    // Opens the multicast discovery socket and captures Zidoo IP/MAC metadata from UDP announcements.
    discoveryUPD() {
        this.discovery = udp.createSocket({ type: 'udp4', reuseAddr: true });
        this.discovery.on('error', (error) => {
            this.logDebug(error);
            this.discovery.close();
        });
        this.discovery.on('listening', () => {
            var address = this.discovery.address();
            this.logDebug('UDP Client listening on ' + address.address + ":" + address.port);
            this.discovery.setBroadcast(true)
            this.discovery.setMulticastTTL(128);
            this.discovery.addMembership('239.39.3.9');
            this.helloMessage();
        });

        this.discovery.on('message', (message, remote) => {
            this.logDebug('Message received From: ' + remote.address + ':' + remote.port);
            // Parse UDP payload defensively because announcements are not guaranteed to include all keys.
            const newMessageRaw = message.toString('utf8');
            const messageBodyStart = newMessageRaw.indexOf('\n');
            const newMessage = messageBodyStart >= 0 ? newMessageRaw.substring(messageBodyStart + 1) : newMessageRaw;
            const properties = newMessage.split('\r\n');
            const zidooInfo = {};
            for (const property of properties) {
                if (!property) {
                    continue;
                }
                const separatorIndex = property.indexOf(':');
                if (separatorIndex <= 0) {
                    continue;
                }
                const propertyKey = property.substring(0, separatorIndex).trim();
                const propertyValue = property.substring(separatorIndex + 1).trim();
                zidooInfo[propertyKey] = propertyValue;
            }
            if (typeof zidooInfo.host === 'string' && zidooInfo.host.length > 0 && !zidooInfo.host.includes('239.39.3.9')) {
                this.logDebug(zidooInfo);
                this.ZIDOO_IP = zidooInfo.host.replace(/\s+/g, '');
                this.IPReceived = true;
            }
        });
        this.discovery.bind(this.ZIDOO_UDP_PORT);

    }
    // Converts any value into a safe single-line string for logs.
    formatLogValue(message) {
        if (typeof message === 'string') {
            return message;
        }
        if (message instanceof Error) {
            return message.stack || message.message;
        }
        try {
            return JSON.stringify(message);
        }
        catch (error) {
            return String(message);
        }
    }
    // Returns the cached on/off state for HomeKit power reads.
    getOn(callback) {
        let isOn = this.powerState;
        this.logDebug('Get Power ->', isOn);
        callback(null, isOn);
    }
    // Reuses an existing input service when available, otherwise creates it and wires dynamic ConfiguredName reads.
    getOrCreateInputSource(definition) {
        const existingService = this.accessory.getService(definition.existingServiceName || definition.serviceName)
            || this.accessory.getService(definition.serviceName);
        const service = existingService || this.createInputSourceService(definition);
        if (typeof definition.onGet === 'function') {
            service.getCharacteristic(this.platform.Characteristic.ConfiguredName)
                .on('get', (callback) => {
                    const currentValue = definition.onGet();
                    if (definition.logOnGet === true) {
                        this.logDebug('Getting' + currentValue);
                    }
                    callback(null, currentValue);
                });
        }
        this.tvService.addLinkedService(service);
        this[definition.propertyName] = service;
        return service;
    }
    // Returns the declarative list of optional stateless remote-control switches.
    getStatelessSwitchConfigs() {
        return STATELESS_SWITCH_CONFIGS;
    }
    // Handles music-state payloads and updates current playback status plus music metadata.
    handleMusicStatusPayload(rawData) {
        this.logDebug(this.moviePlaying);
        if (this.turnOffCommand !== true && this.standbyMode === 0) {
            this.newPowerState(true);
        }
        const volumeData = rawData.volumeData && typeof rawData.volumeData === 'object' ? rawData.volumeData : null;
        if (volumeData) {
            const maxVolume = this.toFiniteNumber(volumeData.maxVolume, 0);
            const currentVolumeRaw = typeof volumeData.currenttVolume !== 'undefined' ? volumeData.currenttVolume : volumeData.currentVolume;
            const currentVolume = this.toFiniteNumber(currentVolumeRaw, NaN);
            if (maxVolume > 0 && Number.isFinite(currentVolume)) {
                this.maxVolume = maxVolume;
                const normalizedVolume = Math.round((currentVolume / maxVolume) * 100);
                this.newVolumeStatus(normalizedVolume);
            }
            if (typeof volumeData.isMute !== 'undefined') {
                this.isMute = volumeData.isMute;
                this.isMuteAvailable = true;
            }
        }
        const state = this.toFiniteNumber(rawData.state, 0);
        if (state === 3) {
            this.newPlayBackState([true, false, false]);
            this.showState = true;
            this.musicPlaying = true;
        }
        else if (state === 4) {
            this.newPlayBackState([false, true, false]);
            this.showState = true;
            this.musicPlaying = true;
        }
        else if (state === 0 && this.moviePlaying === false) {
            this.musicPlaying = false;
            this.newPlayBackState([false, false, false]);
            this.mediaDetailsReset();
        }
        else if (state === 0) {
            this.musicPlaying = false;
        }
        if (state !== 0) {
            if (this.turnOffCommand !== true && this.standbyMode === 0) {
                this.newPowerState(true);
            }
            this.logDebug("Music details");
            this.logDebug(rawData);
            const durationMs = this.toFiniteNumber(rawData.duration, 0);
            const positionMs = this.toFiniteNumber(rawData.position, 0);
            this.movieDuration = Math.floor(durationMs / 1000);
            this.movieElapsed = positionMs / 1000;
            this.newMovieTime(positionMs / 1000);
            const playingMusic = rawData.playingMusic && typeof rawData.playingMusic === 'object' ? rawData.playingMusic : {};
            this.newSubtitle('Audio Channels: ' + (playingMusic.channels || 'Unknown') + ', ' + 'Sample Rate: ' + (playingMusic.sampleRate || 'Unknown'));
            this.newVideoFormat('Format: ' + (playingMusic.extension || 'Unknown'));
            this.newAudioFormat('Bitrate: ' + (playingMusic.bitrate || 'Unknown'));
            this.newLanguage('File Size: ' + (playingMusic.fileSize || 'Unknown'));
            const songTitle = (playingMusic.title || 'Unknown') + " - " + (playingMusic.artist || 'Unknown');
            this.newInputName(this.nameLengthCheck(songTitle));
            this.newInputDuration(this.normalizeRuntimeFromMs(durationMs));
        }
    }
    // Handles movie playback status payloads and updates playback/media metadata defensively.
    handleVideoStatusPayload(rawData) {
        if (this.turnOffCommand !== true && this.standbyMode === 0) {
            this.newPowerState(true);
        }
        const videoPayload = rawData.video && typeof rawData.video === 'object' ? rawData.video : null;
        if (!videoPayload) {
            this.logDebug('Missing video payload in getPlayStatus response.');
            return;
        }
        this.logDebug(videoPayload.status);
        this.logDebug(this.musicPlaying);
        const videoStatus = this.toFiniteNumber(videoPayload.status, -1);
        if (videoStatus === 0 && this.musicPlaying === false) {
            this.newPlayBackState([false, true, false]);
            this.moviePlaying = true;
            this.showState = true;
            this.standbyMode = 0;
        }
        if (videoStatus === 1) {
            this.newPlayBackState([true, false, false]);
            this.moviePlaying = true;
            this.showState = true;
            this.standbyMode = 0;
        }
        const videoPath = typeof videoPayload.path === 'string' ? videoPayload.path : '';
        if (videoPath === '') {
            return;
        }
        this.logDebug(rawData);
        let movie3D = '';
        // Guard optional 3D payload fields to avoid runtime crashes on older firmware responses.
        if (rawData['3D'] && rawData['3D'].information === '3D') {
            movie3D = ' (3D)';
        }
        const videoTitle = typeof videoPayload.title === 'string' ? videoPayload.title : 'Media Title';
        this.updateVideoTitle(videoTitle, videoPath, movie3D);
        const videoDurationMs = this.toFiniteNumber(videoPayload.duration, 0);
        this.movieDuration = Math.floor(videoDurationMs / 1000);
        this.newInputDuration(this.normalizeRuntimeFromMs(videoDurationMs));
        const currentPositionMs = this.toFiniteNumber(videoPayload.currentPosition, 0);
        this.movieElapsed = currentPositionMs / 1000;
        this.newMovieTime(currentPositionMs / 1000);
        if (typeof videoPayload.output !== 'undefined') {
            this.applyDetailedVideoMetadata(rawData, videoPayload);
            return;
        }
        this.applyBasicVideoMetadata(rawData, videoPayload);
    }
    //////Zidoo Hello message
    // Broadcasts a JOIN packet that prompts Zidoo devices to announce themselves.
    helloMessage() {
        this.hello = udp.createSocket({ type: 'udp4', reuseAddr: true });
        const message = Buffer.from('JOIN\r\nuuid: CataNico\r\ntype: 2\r\nhost: 239.39.3.9\r\nport: 18239\r\n\r\n');
        this.hello.send(message, 18239, '239.39.3.9', (err) => {
            if (err) {
                this.logDebug('Error sending UDP message: ' + err);
                this.scheduleTimeout(() => {
                    this.helloMessage();
                }, 2000);
            }
            // this.logInfo('UDP message sent to ' + HOST + ':' + PORT);
            this.hello.close();
        });
    }
    /////////////////HTTP Event decoder
    // Decodes Zidoo API responses and routes updates into focused handlers for each response type.
    httpEventDecoder(rawData, key) {
        this.logDebug(`${key} Sent by HTTP`);
        this.logDebug(rawData);
        if (!rawData || typeof rawData !== 'object') {
            this.logDebug('Ignoring empty or invalid HTTP payload.');
            return;
        }
        if (rawData.status === 806 || rawData.status === 405) {
            this.moviePlaying = false;
            return;
        }
        if (rawData.status !== 200) {
            return;
        }
        this.updateMacFromHttpPayload(rawData);
        if (this.standbyMode === 1 && key.includes('Menu')) {
            this.standbyMode = 0;
        }
        this.logCommandResponse(key);
        this.routeHttpEvent(rawData, key);
    }
    // Detects transport failures that typically mean the device is unreachable/offline.
    isOfflineTransportError(error) {
        if (!error) {
            return false;
        }
        const errorCode = typeof error.code === 'string' ? error.code.toUpperCase() : '';
        if (errorCode === 'ECONNREFUSED'
            || errorCode === 'ECONNRESET'
            || errorCode === 'EHOSTUNREACH'
            || errorCode === 'EHOSTDOWN'
            || errorCode === 'ENETUNREACH'
            || errorCode === 'ETIMEDOUT'
            || errorCode === 'EPIPE') {
            return true;
        }
        const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
        return errorMessage.includes('socket hang up')
            || errorMessage.includes('timed out')
            || errorMessage.includes('connect econnrefused')
            || errorMessage.includes('connect ehostdown')
            || errorMessage.includes('host is down')
            || errorMessage.includes('host unreachable')
            || errorMessage.includes('network is unreachable');
    }
    // Writes command response logs at debug/info level based on whether the command is a periodic poll.
    logCommandResponse(key) {
        if (key.includes('getModel') || key.includes('getState') || key.includes('getPlayStatus') || key.includes('volumeStatus')) {
            this.logDebug(`Response: ${this.commandName(key)} Command Executed`);
            return;
        }
        this.logInfo(`Response: ${this.commandName(key)} Command Executed`);
    }
    // Logs a debug message with device-name prefix.
    logDebug(...messages) {
        const prefix = this.config.name ? `[${this.config.name}] ` : '';
        this.platform.log.debug(prefix + messages.map((message) => this.formatLogValue(message)).join(' '));
    }
    // Logs an error with robust value normalization.
    logError(...messages) {
        const prefix = this.config.name ? `[${this.config.name}] ` : '';
        this.platform.log.error(prefix + messages.map((message) => this.formatLogValue(message)).join(' '));
    }
    /////logs

    // Logs an informational message with device-name prefix.
    logInfo(...messages) {
        const prefix = this.config.name ? `[${this.config.name}] ` : '';
        this.platform.log(prefix + messages.map((message) => this.formatLogValue(message)).join(' '));
    }
    // Clears playback-specific metadata and preserves last-played title when available.
    mediaDetailsReset() {
        this.logDebug("Reset details");
        this.showState = false;
        this.movieDuration = 0;
        this.movieElapsed = 0;
        this.newMovieTime(0);
        if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== 'Media Title' && !this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value.includes('Last Played: ') && this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== 'Standby') {
            this.newInputName(this.nameLengthCheck('Last Played: ' + this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value));
        }
        //this.newAudioFormat('Audio Information');
        //this.newInputDuration('Runtime');
        //this.newSubtitle('Additional Information');
        //this.newVideoFormat('Video Information');
        //this.newLanguage('Audio Language');

    }

    ////Name Check
    // Trims long metadata strings to stay under HomeKit characteristic-length limits.
    nameLengthCheck(newName) {
        if (newName.length >= 64) {
            newName = newName.slice(0, 60) + '...';
        }
        return newName;
    }
    // Updates audio-format metadata and visibility.
    newAudioFormat(audioType) {
        if (typeof audioType !== 'undefined') {
            this.logDebug(audioType);
            this.logDebug('New audio information: ' + audioType);
            this.logDebug(audioType);
            if (this.mediaAudioFormat !== audioType) {
                this.mediaAudioFormat = audioType;
                this.logDebug(audioType);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    // Maps raw audio codec strings from device telemetry into user-friendly labels.
    newAudioStatus(audio) {
        this.logDebug(audio);
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
    // Formats and updates runtime text (Runtime: HH:MM:SS + unit suffix).
    newInputDuration(newDuration) {
        if (typeof newDuration !== 'undefined') {
            this.logDebug('New input duration: ' + newDuration);
            if (!newDuration.includes('Runtime')) {
                let hourMintue = ''
                if (this.movieDuration > 3600) {
                    hourMintue = 'Hours';
                }
                else if (this.movieDuration === 3600) {
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
    // Updates the current media title input source.
    newInputName(newName) {
        if (typeof newName !== 'undefined') {
            this.logDebug('New input name: ' + newName);
            if (this.inputName !== newName) {
                //this.logInfo(newName);
                this.inputName = newName;
                this.logDebug(this.inputName);
                this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                //this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
            }
        }
    }
    // Converts internal input-state flags to ActiveIdentifier and updates the TV service.
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
            this.inputID = this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).value;
        }
        else {
        }
        this.tvService.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        // this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).updateValue(this.inputID);
    }
    // Updates language metadata and visibility.
    newLanguage(lang) {
        if (typeof lang !== 'undefined') {
            this.logDebug('New audio language: ' + lang);
            if (this.language !== lang) {
                this.language = lang;
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    // Computes playback progress and updates optional media-progress controls and timer services.
    newMovieTime(newMovieTime) {
        if (newMovieTime === 0) {
            this.currentMovieProgressState = false;
            this.currentMovieProgress = 0;
        }
        if (newMovieTime !== 0) {
            this.currentMovieProgressState = true;
        }
        if (this.movieDuration !== 0) {
            this.currentMovieProgress = Math.round(newMovieTime * 100 / (this.movieDuration));
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
            // Keep timer Active/InUse aligned with a stable numeric target (0/1).
            const targetMovieTimerActiveState = this.currentMovieProgressState ? 1 : 0;
            if (this.movieTimer.getCharacteristic(this.platform.Characteristic.Active).value !== targetMovieTimerActiveState) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.Active, targetMovieTimerActiveState);
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.InUse, targetMovieTimerActiveState);
            }
            if ((this.movieDuration - this.movieElapsed) !== this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration).value) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.RemainingDuration, (this.movieDuration - this.movieElapsed));
            }
            if (this.movieDuration !== this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration).value) {
                this.movieTimer.updateCharacteristic(this.platform.Characteristic.SetDuration, this.movieDuration);
            }
        }
    }
    // Maps play/pause/stop booleans into HomeKit media state and synchronizes related services.
    newPlayBackState(newPlay) {
        this.playBackState = newPlay;
        // Compare array values explicitly; array identity checks never match equivalent literals.
        const isPlaybackFullyStopped = this.playBackState[0] === false
            && this.playBackState[1] === false
            && this.playBackState[2] === false;
        if (this.turnOffCommand === false || isPlaybackFullyStopped) {
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
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
                }
                if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                    this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                    //this.pause.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[1]);
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);

                }
                if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                    this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                    //this.stop.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[2]);
                    //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
                }
            }
            if (this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).value !== this.mediaState) {
                this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                // this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);

            }

        }
    }
    // Updates power state in TV/optional switch services and handles Standby/Media Title label transitions.
    newPowerState(newValue) {
        if (newValue === true) {
            this.powerStateTV = 1;
            if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value === 'Media Title') {
                this.newInputName('Standby');
            }
        }
        else {
            this.powerStateTV = 0;
            if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value === 'Standby') {
                this.newInputName('Media Title');
            }
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
    // Updates subtitle/additional-info metadata and visibility.
    newSubtitle(newSub) {
        this.logDebug(newSub);
        if (this.subtitleInfo !== newSub) {
            this.subtitleInfo = newSub;
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.subtitleInfo);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
    }
    // Updates video-format metadata and keeps its visibility synced to playback detail state.
    newVideoFormat(videoFormat) {
        if (typeof videoFormat !== 'undefined') {
            this.logDebug('New input progress: ' + videoFormat);
            this.logDebug(videoFormat);
            if (this.mediaVideoFormat !== videoFormat) {
                this.logDebug(videoFormat);
                this.mediaVideoFormat = videoFormat;
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.videoFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    //////////Current Status//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Applies normalized volume updates across speaker and optional dimmer/fan control services.
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
                if (this.isMuteAvailable === true) {
                    this.currentMuteState = this.isMute;
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
    // Formats milliseconds to HH:MM:SS-style runtime text while preserving the previous leading-hour behavior.
    normalizeRuntimeFromMs(durationMs) {
        const runtimeSeconds = Math.max(0, Math.floor(this.toFiniteNumber(durationMs, 0) / 1000));
        let runtimeNumber = this.secondsToTime(runtimeSeconds);
        if (runtimeNumber.startsWith('0')) {
            runtimeNumber = runtimeNumber.substring(1);
        }
        return runtimeNumber;
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////Pause
    // Reports whether playback is currently in the paused state.
    pauseSwitchStateGet(callback) {
        this.logDebug('Pause State');
        let currentValue = this.playBackState[1];
        callback(null, currentValue);
    }
    // Sends a PAUSE key when the Pause switch is toggled on.
    pauseSwitchStateSet(value, callback) {
        this.logDebug('Pause set to', value);
        if (value === true) {
            this.sending([this.pressedButton('PAUSE')]);
        }
        callback(null);
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////Play
    // Reports whether playback is currently in the playing state.
    playSwitchStateGet(callback) {
        this.logDebug('Play State');
        let currentValue = this.playBackState[0];
        callback(null, currentValue);
    }
    // Sends a PLAY key when the Play switch is toggled on.
    playSwitchStateSet(value, callback) {
        this.logDebug('Play set to:', value);
        if (value === true) {
            this.sending([this.pressedButton('PLAY')]);
        }
        callback(null);
    }
    /////Zidoo controls/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Maps a logical button name to the exact Zidoo remote-control API key endpoint.
    pressedButton(name) {
        const baseKey = "http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/sendkey?key=Key.";
        if (name === 'POWER OFF') {
            if (this.config.standby === false) {
                return baseKey + 'PowerOn.Poweroff';
            }
            return baseKey + 'PowerOn.Standby';
        }
        const commandSuffix = BUTTON_KEY_SUFFIXES[name];
        if (typeof commandSuffix === 'undefined') {
            this.logError(`Unknown button command: ${name}`);
            return null;
        }
        return baseKey + commandSuffix;
    }
    // Probes `getModel` and only allows full polling when the player is reachable.
    async probeDeviceAvailability() {
        if (this.config.autoIPMac === true && this.IPReceived !== true) {
            return false;
        }
        const now = Date.now();
        if (this.availabilityProbeInFlight === true) {
            return false;
        }
        if (this.deviceAvailableForPolling === false && now < this.nextAvailabilityProbeAt) {
            return false;
        }
        const probeUrl = this.query('GET MODEL INFO');
        if (!probeUrl) {
            return false;
        }
        this.availabilityProbeInFlight = true;
        try {
            const isAvailable = await this.sending(probeUrl);
            this.deviceAvailableForPolling = isAvailable === true;
            if (this.deviceAvailableForPolling === true) {
                if (this.waitingForDeviceAvailability === true) {
                    this.logDebug('Device is reachable again; resuming status polling.');
                }
                this.waitingForDeviceAvailability = false;
                return true;
            }
            this.nextAvailabilityProbeAt = Date.now() + this.availabilityProbeIntervalMs;
            if (this.waitingForDeviceAvailability === false) {
                this.logDebug('Device is unavailable; waiting before polling all status endpoints.');
                this.waitingForDeviceAvailability = true;
            }
            return false;
        }
        finally {
            this.availabilityProbeInFlight = false;
        }
    }
    ///Query////////////////////////////////////////////////////////////////////////////////////////////////////
    // Builds HTTP polling endpoints for model, music, playback, and volume status.
    query(qName) {
        let key = "http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/";
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
            default:
                this.logError(`Unknown query name: ${qName}`);
                return null;
        }
        return key;
    }
    // Probes availability first, then queues periodic status polling while skipping overlap.
    async queuePollingRequests() {
        if (this.pollInFlight === true) {
            this.logDebug('Skipping polling cycle because the previous cycle is still in flight.');
            return;
        }
        this.pollInFlight = true;
        try {
            const isDeviceAvailable = await this.probeDeviceAvailability();
            if (!isDeviceAvailable) {
                return;
            }
            const requests = [
                { delayMs: 0, queryName: 'MUSIC STATUS' },
                { delayMs: 250, queryName: 'PLAYBACK STATUS' },
                { delayMs: 500, queryName: 'VOLUME STATUS' },
            ];
            const tasks = requests.map(async (requestDefinition) => {
                if (requestDefinition.delayMs > 0) {
                    await this.delayByMs(requestDefinition.delayMs);
                }
                const requestUrl = this.query(requestDefinition.queryName);
                if (!requestUrl) {
                    return;
                }
                await this.sending(requestUrl);
            });
            await Promise.allSettled(tasks);
        }
        catch (error) {
            this.logError('Polling cycle failed: ' + error.message);
        }
        finally {
            this.pollInFlight = false;
        }
    }
    // Registers a shutdown hook once so timers/sockets are cleaned up when Homebridge exits.
    registerShutdownHandler() {
        if (!this.platform || !this.platform.api || typeof this.platform.api.on !== 'function') {
            return;
        }
        this.platform.api.on('shutdown', () => {
            this.clearManagedTimers();
            if (this.httpAgent && typeof this.httpAgent.destroy === 'function') {
                this.httpAgent.destroy();
            }
            if (this.discovery) {
                try {
                    this.discovery.close();
                }
                catch (error) {
                    this.logDebug('Error closing discovery socket: ' + error.message);
                }
            }
            if (this.hello) {
                try {
                    this.hello.close();
                }
                catch (error) {
                    this.logDebug('Error closing hello socket: ' + error.message);
                }
            }
        });
    }
    // Routes a parsed HTTP response to the corresponding command-specific handler.
    routeHttpEvent(rawData, key) {
        if (key.includes('PowerOn.Poweroff')) {
            this.turnOffAll();
            return;
        }
        if (key.includes('PowerOn.Standby')) {
            this.turnOffAll();
            this.standbyMode = 1;
            return;
        }
        if (key.includes('volumeStatus')) {
            this.applyVolumePayload(rawData);
            return;
        }
        if (key.includes('MediaPlay')) {
            if (!key.includes('MediaPlay.Pause')) {
                this.newPlayBackState([true, false, false]);
            }
            return;
        }
        if (key.includes('MediaStop')) {
            this.newPlayBackState([false, false, false]);
            this.mediaDetailsReset();
            return;
        }
        if (key.includes('MediaPause')) {
            this.newPlayBackState([false, true, false]);
            return;
        }
        if (key.includes('getModel')) {
            if (this.turnOffCommand !== true && this.standbyMode === 0) {
                this.newPowerState(true);
            }
            return;
        }
        if (key.includes('getPlayStatus')) {
            this.handleVideoStatusPayload(rawData);
            return;
        }
        if (key.includes('getState')) {
            this.handleMusicStatusPayload(rawData);
        }
    }
    // Removes a HomeKit service only when it exists, avoiding startup/shutdown crashes on undefined references.
    safeRemoveService(service) {
        if (typeof service === 'undefined' || service === null) {
            return;
        }
        try {
            this.accessory.removeService(service);
        }
        catch (error) {
            this.logDebug('Error removing service: ' + error.message);
        }
    }
    // Normalizes a user-facing device name into a safe file-name segment for log files.
    sanitizeFileName(name) {
        return `${name || 'zidoo'}`.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    }
    // Schedules an interval and tracks it so it can be cleared during plugin shutdown.
    scheduleInterval(handler, intervalMs) {
        const intervalHandle = setInterval(handler, intervalMs);
        this.managedIntervals.add(intervalHandle);
        return intervalHandle;
    }
    // Schedules a timeout and tracks it so it can be cleared during plugin shutdown.
    scheduleTimeout(handler, delayMs) {
        const timeoutHandle = setTimeout(() => {
            this.managedTimeouts.delete(timeoutHandle);
            handler();
        }, delayMs);
        this.managedTimeouts.add(timeoutHandle);
        return timeoutHandle;
    }
    /////////Data Management/////////////////////////////////////////////////////////////
    // Converts seconds to HH:MM:SS.
    secondsToTime(seconds) {
        let date = new Date(0);
        date.setSeconds(parseInt(seconds)); // specify value for SECONDS here
        let timeString = date.toISOString().substr(11, 8);
        return timeString
    }

    ///////Send HTTP command///////////////////////////

    // Sends one Zidoo HTTP command, parses JSON responses, and suppresses expected offline transport noise for availability/power-off flows.
    sending(url) {
        return new Promise((resolve) => {
            if (this.config.autoIPMac !== false && this.IPReceived !== true) {
                this.logDebug('IP address is not set yet, turn on the device');
                resolve(false);
                return;
            }
            const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
            if (!regexExp.test(this.ZIDOO_IP)) {
                this.logDebug('IP address is not valid');
                resolve(false);
                return;
            }
            const requestUrl = Array.isArray(url) ? url[0] : url;
            if (typeof requestUrl !== 'string' || requestUrl.length === 0) {
                this.logError('Command URL is invalid or empty.');
                resolve(false);
                return;
            }
            let key;
            if (requestUrl.includes('getState')) {
                key = 'getState';
            }
            else if (requestUrl.includes('getPlayStatus')) {
                key = 'getPlayStatus';
            }
            else if (requestUrl.includes('getModel')) {
                key = 'getModel';
            }
            else if (requestUrl.includes('seek')) {
                key = 'seek';
            }
            else if (requestUrl.includes('RemoteControl/changeVolume?type=')) {
                key = 'volumeStatus';
            }
            else {
                const keyParts = requestUrl.split('=');
                key = keyParts[keyParts.length - 1] || 'UNKNOWN';
            }
            this.logDebug(requestUrl);
            this.logDebug(key);
            this.commandLog(key);
            // Count only real HTTP attempts so offline recovery logic is not triggered by invalid input.
            this.httpNotResponding += 1;
            const suppressExpectedOfflineTransportErrors = key === 'getModel'
                || key === 'Key.PowerOn.Poweroff'
                || key === 'Key.PowerOn.Standby';
            let completed = false;
            let requestTimedOut = false;
            const finish = (success) => {
                if (completed) {
                    return;
                }
                completed = true;
                resolve(success);
            };
            const httpRequest = request.get(requestUrl, { agent: this.httpAgent }, (res) => {
                if (typeof res.statusCode === 'number' && res.statusCode >= 400) {
                    this.logError(`HTTP ${res.statusCode} while sending ${key}`);
                }
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        this.httpNotResponding = 0;
                        this.deviceAvailableForPolling = true;
                        this.waitingForDeviceAvailability = false;
                        this.httpEventDecoder(parsedData, key);
                        finish(true);
                    } catch (error) {
                        this.logError(`Failed to parse response for ${key}: ${error.message}`);
                        finish(false);
                    }
                });
            });
            httpRequest.setTimeout(5000, () => {
                requestTimedOut = true;
                const timeoutError = new Error('Request timeout');
                timeoutError.code = 'ETIMEDOUT';
                this.deviceAvailableForPolling = false;
                this.nextAvailabilityProbeAt = Date.now() + this.availabilityProbeIntervalMs;
                if (!(suppressExpectedOfflineTransportErrors && this.isOfflineTransportError(timeoutError))) {
                    this.logError(`HTTP timeout while sending ${key}`);
                }
                httpRequest.destroy(timeoutError);
                finish(false);
            });
            httpRequest.on('error', (error) => {
                if (requestTimedOut === true && error && error.message === 'Request timeout') {
                    finish(false);
                    return;
                }
                const isOfflineFailure = this.isOfflineTransportError(error);
                if (isOfflineFailure) {
                    this.deviceAvailableForPolling = false;
                    this.nextAvailabilityProbeAt = Date.now() + this.availabilityProbeIntervalMs;
                }
                if (!(suppressExpectedOfflineTransportErrors && isOfflineFailure)) {
                    this.logError(`HTTP request failed for ${key}: ${error.message}`);
                }
                finish(false);
            });
        });
    }
    // Converts slider percentage to absolute seek time and sends the appropriate music/video seek endpoint.
    setMovieSeekPositionFromPercent(newValue) {
        let newSendValue = Math.round(newValue * this.movieDuration * 10);
        const totalMovieTime = this.movieDuration * 1000;
        if (newSendValue > totalMovieTime) {
            newSendValue = totalMovieTime;
        }
        if (this.musicPlaying === true) {
            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooMusicControl/v2/seekTo?time=" + newSendValue]);
        }
        else {
            this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooVideoPlay/seekTo?positon=" + newSendValue]);
        }
        this.newMovieTime(newSendValue / 1000);
    }
    // Handles the optional Power switch service and maps it to wake/shutdown behavior.
    setOn(value, callback) {
        let zidooState = value;
        if (zidooState === true) {
            this.newPowerState(true);
            this.turnOnCommand = true;
            this.turnOffCommand = false;
            this.WakeupOnLAN();
            //this.sending([this.pressedButton('POWER ON')]);
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
                this.scheduleTimeout(() => {
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
        this.logDebug('Set Power to ->', value);
        callback(null);
    }
    // Configures HomeKit Accessory Information service values.
    setupAccessoryInformationService() {
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.config.manufacturer)
            .setCharacteristic(this.platform.Characteristic.Model, this.config.modelName)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.config.serialN)
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '4.0.0');
    }
    // Creates optional switches and controls as a dedicated setup phase.
    setupOptionalServices(accessory) {
        if (this.config.volume === true) {
            this.buildVolumeControlService();
        }
        if (this.config.movieControl === true) {
            this.buildMovieProgressService();
        }
        if (this.config.powerB === true) {
            // Resolve the power switch by explicit name/subtype to avoid binding to unrelated Switch services.
            const powerSwitchServiceName = `${accessory.context.device.zidooDisplayName} Power Switch`;
            this.service = this.accessory.getService(powerSwitchServiceName)
                || this.accessory.addService(this.platform.Service.Switch, powerSwitchServiceName, 'CataNicoGaTa-PWR');
            this.service.setCharacteristic(this.platform.Characteristic.Name, powerSwitchServiceName);
            this.service.updateCharacteristic(this.platform.Characteristic.Name, powerSwitchServiceName);
            this.service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.service.setCharacteristic(this.platform.Characteristic.ConfiguredName, powerSwitchServiceName);
            this.service.getCharacteristic(this.platform.Characteristic.On)
                .on('set', this.setOn.bind(this))
                .on('get', this.getOn.bind(this));
        }
        if (!this.config.removePlayback) {
            const playbackSwitchDefinitions = [
                {
                    propertyName: 'play',
                    serviceName: 'Play',
                    uniqueId: 'CataNicoGaTa-10',
                    onGet: this.playSwitchStateGet.bind(this),
                    onSet: this.playSwitchStateSet.bind(this),
                },
                {
                    propertyName: 'pause',
                    serviceName: 'Pause',
                    uniqueId: 'CataNicoGaTa-11',
                    onGet: this.pauseSwitchStateGet.bind(this),
                    onSet: this.pauseSwitchStateSet.bind(this),
                },
                {
                    propertyName: 'stop',
                    serviceName: 'Stop',
                    uniqueId: 'CataNicoGaTa-12',
                    onGet: this.stopSwitchStateGet.bind(this),
                    onSet: this.stopSwitchStateSet.bind(this),
                },
            ];
            for (const definition of playbackSwitchDefinitions) {
                this.createStatefulSwitch(definition);
            }
        }
        this.buildStatelessSwitches();
        if (this.config.muteB === true) {
            this.mute = this.accessory.getService('Mute') ||
                this.accessory.addService(this.platform.Service.Switch, 'Mute', 'CataNicoGaTa-9001');
            this.mute.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.mute.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Mute');
            this.mute.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.logDebug('Mute GET On');
                    let currentValue = false;
                    if (this.isMuteAvailable === true) {
                        currentValue = this.isMute;
                    }
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.logDebug('Mute SET On:', value);
                    if (value === true) {
                        this.volumeBeforeMute = this.currentVolume;
                        this.sending([this.pressedButton('MUTE')]);
                    }
                    if (this.isMuteAvailable === false) {
                        this.scheduleTimeout(() => {
                            this.mute.updateCharacteristic(this.platform.Characteristic.On, false);
                        }, this.statelessTimeOut);
                    }
                    else if (value === false) {
                        this.volumeChange(this.volumeBeforeMute);
                    }
                    callback(null);
                });
        }
        if (this.config.remainMovieTimer) {
            // Resolve movie timer by explicit name/subtype to avoid accidental binding to unrelated Valve services.
            this.movieTimer = this.accessory.getService('Zidoo Movie Timer')
                || this.accessory.addService(this.platform.Service.Valve, 'Zidoo Movie Timer', 'Movie Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.Name, 'Zidoo Timer');
            this.movieTimer.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Zidoo Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ValveType, this.platform.Characteristic.ValveType.IRRIGATION);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.Active)
                .on('get', (callback) => {
                    const currentValue = this.currentMovieProgressState ? 1 : 0;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    callback(null);
                });
            this.movieTimer.setCharacteristic(this.platform.Characteristic.InUse, this.platform.Characteristic.InUse.NOT_IN_USE);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration)
                .on('get', (callback) => {
                    const currentValue = (this.movieDuration - this.movieElapsed);
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4,
                });
            this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration)
                .on('get', (callback) => {
                    const currentValue = this.movieDuration;
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4,
                });
        }
    }
    // Configures TelevisionSpeaker service and links it to the TV service.
    setupSpeakerService() {
        this.speakerService = this.accessory.getService('Zidoo Volume Control')
            || this.accessory.addService(this.platform.Service.TelevisionSpeaker, 'Zidoo Volume Control', 'CataNicoGaTa-20');
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
                callback(null);
            });
        this.speakerService.getCharacteristic(this.platform.Characteristic.Mute)
            .on('get', (callback) => {
                let currentValue = this.currentMuteState;
                if (this.isMuteAvailable === true) {
                    currentValue = this.isMute;
                    this.currentMuteState = this.isMute;
                }
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.logDebug('Volume Value set to: Mute/Unmute');
                if (newValue === true) {
                    this.volumeBeforeMute = this.currentVolume;
                    this.volumeChange(0);
                }
                else {
                    this.volumeChange(this.volumeBeforeMute);
                }
                callback(null);
            });
        this.speakerService.addCharacteristic(this.platform.Characteristic.Volume)
            .on('get', (callback) => {
                callback(null, this.currentVolume);
            })
            .on('set', (newValue, callback) => {
                this.volumeChange(newValue);
                this.logDebug('Volume Value set to: ' + newValue);
                callback(null);
            });
        this.tvService.addLinkedService(this.speakerService);
    }
    // Configures the main Television service and media-state characteristics.
    setupTelevisionServices() {
        this.tvService = this.accessory.getService(this.config.name) ||
            this.accessory.addService(this.platform.Service.Television, this.config.name, 'CataNicoGaTa-7');
        this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.config.name);
        this.tvService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(this.platform.Characteristic.Active)
            .on('get', (callback) => {
                callback(null, this.powerStateTV);
            })
            .on('set', (newValue, callback) => {
                this.logDebug('Set Zidoo Active to: ' + newValue);
                if (newValue === 1) {
                    this.newPowerState(true);
                    this.turnOnCommand = true;
                    this.turnOffCommand = false;
                    this.WakeupOnLAN();
                }
                else if (this.playBackState[0] === true || this.playBackState[1] === true) {
                    this.sending([this.pressedButton('STOP')]);
                    this.newPowerState(false);
                    this.turnOffCommand = true;
                    this.turnOnCommand = false;
                    this.turnOffAll();
                    this.scheduleTimeout(() => {
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
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.ClosedCaptions)
            .on('get', (callback) => {
                this.logDebug('Subtitle GET On');
                callback(null, 0);
            })
            .on('set', (value, callback) => {
                this.logDebug('Subtitle SET On:', value);
                if (value === 1) {
                    this.sending([this.pressedButton('SUBTITLE')]);
                }
                this.tvService.updateCharacteristic(this.platform.Characteristic.ClosedCaptions, 0);
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.Brightness)
            .on('get', (callback) => {
                callback(null, this.currentVolume);
            })
            .on('set', (newValue, callback) => {
                this.volumeChange(newValue);
                this.logDebug('Volume Value set to: ' + newValue);
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
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', (newValue, callback) => {
                switch (newValue) {
                    case this.platform.Characteristic.RemoteKey.REWIND: {
                        this.logDebug('set Remote Key Pressed: REWIND');
                        this.sending([this.pressedButton('REWIND')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
                        this.logDebug('set Remote Key Pressed: FAST_FORWARD');
                        this.sending([this.pressedButton('FORWARD')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
                        this.logDebug('set Remote Key Pressed: NEXT_TRACK');
                        this.sending([this.pressedButton('NEXT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
                        this.logDebug('set Remote Key Pressed: PREVIOUS_TRACK');
                        this.sending([this.pressedButton('PREVIOUS')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_UP: {
                        this.logDebug('set Remote Key Pressed: ARROW_UP');
                        this.sending([this.pressedButton('CURSOR UP')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
                        this.logDebug('set Remote Key Pressed: ARROW_DOWN');
                        this.sending([this.pressedButton('CURSOR DOWN')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
                        this.logDebug('set Remote Key Pressed: ARROW_LEFT');
                        this.sending([this.pressedButton('CURSOR LEFT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
                        this.logDebug('set Remote Key Pressed: ARROW_RIGHT');
                        this.sending([this.pressedButton('CURSOR RIGHT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.SELECT: {
                        this.logDebug('set Remote Key Pressed: SELECT');
                        this.sending([this.pressedButton('CURSOR ENTER')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.BACK: {
                        this.logDebug('set Remote Key Pressed: BACK');
                        this.sending([this.pressedButton('BACK')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.EXIT: {
                        this.logDebug('set Remote Key Pressed: EXIT');
                        this.sending([this.pressedButton('HOME MENU')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
                        this.logDebug('set Remote Key Pressed: PLAY_PAUSE');
                        this.sending([this.pressedButton('PLAY/PAUSE')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.INFORMATION: {
                        if (this.config.infoToMenu) {
                            this.logDebug('set Remote Key Pressed: MENU');
                            this.sending([this.pressedButton('MENU')]);
                        }
                        else {
                            this.logDebug('set Remote Key Pressed: INFORMATION');
                            this.sending([this.pressedButton('INFO')]);
                        }
                        break;
                    }
                }
                callback(null);
            });
        this.tvService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', (inputIdentifier, callback) => {
                this.logDebug('Active Identifier set to:', inputIdentifier);
                this.inputID = inputIdentifier;
                callback();
            })
            .on('get', (callback) => {
                this.logDebug('Active Identifier set to:', this.inputID);
                callback(null, this.inputID);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.PowerModeSelection)
            .on('set', (newValue, callback) => {
                this.logDebug('Requested Zidoo Settings ' + newValue);
                this.sending([this.pressedButton('MENU')]);
                callback();
            });
        this.buildInputSources();
        this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
            .on('get', (callback) => {
                this.logDebug('Current Playback State', this.mediaState);
                callback(null, this.mediaState);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.TargetMediaState)
            .on('get', (callback) => {
                let currentValue = this.mediaState;
                if (this.mediaState === 4) {
                    currentValue = 2;
                }
                this.logDebug('Current Playback State', currentValue);
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
                this.logDebug('Playback State set to:', value);
                callback(null);
            });
    }
    // Starts UDP discovery workflows when auto IP/MAC mode is enabled.
    startConnectivityServices() {
        if (this.config.autoIPMac === true) {
            this.discoveryUPD();
        }
    }
    // Starts periodic polling/history intervals as a dedicated startup phase.
    startSynchronizationLoops() {
        this.scheduleInterval(() => {
            if (this.turnOffCommand === false && this.turnOnCommand === false) {
                this.queuePollingRequests();
                if (this.httpNotResponding >= this.reconnectionTry && this.httpNotResponding <= this.reconnectionTry + 4) {
                    this.turnOffAll();
                    this.standbyMode = 0;
                    if (this.config.autoIPMac === true) {
                        this.helloMessage();
                    }
                }
                this.syncPolledCharacteristics();
            }
            else {
                this.scheduleTimeout(() => {
                    this.turnOffCommand = false;
                    this.turnOnCommand = false;
                }, 6000);
            }
        }, this.config.pollingInterval);
        this.scheduleInterval(() => {
            if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value === 1 && this.playBackState[0] === true) {
            }
        }, 120000);
    }
    /////////////////////////////////////////////////////////////////////////////////////stop
    // Reports whether playback is currently in the stopped state.
    stopSwitchStateGet(callback) {
        this.logDebug('Stop State');
        let currentValue = this.playBackState[2];
        callback(null, currentValue);
    }
    // Sends a STOP key when the Stop switch is toggled on.
    stopSwitchStateSet(value, callback) {
        this.logDebug('Stop set to:', value);
        if (value === true) {
            this.sending([this.pressedButton('STOP')]);
        }
        callback(null);
    }
    // Removes common media-file extensions from display names while keeping all other names unchanged.
    stripKnownMediaExtension(name) {
        if (typeof name !== 'string') {
            return '';
        }
        return name.replace(/\.(iso|mkv|mp4|mp3)$/i, '');
    }
    // Synchronizes HomeKit characteristic cache values from the latest internal state snapshot.
    syncPolledCharacteristics() {
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
            this.logDebug('Updating Title');
            this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
        }
        if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
            this.logDebug('Updating Runtime');
            this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
        }
        if (this.videoFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaVideoFormat) {
            this.logDebug('Updating Video Information');
            this.videoFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaVideoFormat);
        }
        if (this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaAudioFormat) {
            this.logDebug('Updating Audio Information');
            this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
        }
        if (this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.language) {
            this.logDebug('Updating Language');
            this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
        }
        if (this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.subtitleInfo) {
            this.logDebug('Updating Additional Information');
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.subtitleInfo);
        }
    }
    // Returns a timestamp string used in history logs.
    time() {
        let time = new Date();
        return time.toLocaleDateString() + ' ' + time.toLocaleString('en-US', {
            hour12: false,
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
        });
    }
    // Converts potentially string-based values to finite numbers with a fallback default.
    toFiniteNumber(value, defaultValue = 0) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
    }
    // Resets all runtime state to a fully off/idle baseline.
    turnOffAll() {
        this.newPowerState(false);
        this.newPlayBackState([false, false, false]);
        this.newInputState([false, false, false, false, false, false]);
        this.mediaDetailsReset();
        this.moviePlaying = false;
        this.musicPlaying = false;
        this.newVolumeStatus(0);
        this.isMute = false;

    }
    ////Update instructions
    // Applies an input-state update while writing a decoded command response log.
    updateInputStatus(newInput, response) {
        this.logDebug(`Response: ${this.commandName(response)}`);
        this.newInputState(newInput);
    }
    // Refreshes MAC cache from successful HTTP payloads when the device reports a MAC value.
    updateMacFromHttpPayload(rawData) {
        if (typeof rawData.net_mac !== 'undefined' && this.config.mac !== rawData.net_mac) {
            this.config.mac = rawData.net_mac;
        }
        this.macReceived = true;
    }
    // Derives a user-facing media title from the video payload and updates the active input label.
    updateVideoTitle(videoTitle, videoPath, movie3D) {
        let nameInput = this.stripKnownMediaExtension(videoTitle);
        if (videoTitle === 'AVCHD') {
            const pathParts = typeof videoPath === 'string' ? videoPath.split('/') : [];
            if (pathParts[pathParts.length - 1] === 'AVCHD' && typeof pathParts[pathParts.length - 2] === 'string') {
                nameInput = this.stripKnownMediaExtension(pathParts[pathParts.length - 2]);
            }
        }
        this.newInputName(this.nameLengthCheck(`${nameInput}${movie3D}`));
    }
    /////

    ///////Handlers////////////////////////////////////////////////////////////////////////////////////////
    // Converts HomeKit percentage volume to Zidoo's native range and sends the HTTP volume command.
    volumeChange(newVolume) {
        let newVolumeValue = Math.round(Math.min(Math.max((this.maxVolume * newVolume) / 100, 0), this.maxVolume));
        this.sending(["http://" + this.ZIDOO_IP + ":" + this.ZIDOO_PORT + "/ZidooControlCenter/RemoteControl/changeVolume?type=2&value=" + newVolumeValue]);

    }


    ///////////////Wake up/////
    // Powers the player using WOL, or falls back to MENU when the device is in standby mode.
    WakeupOnLAN() {
        if (this.standbyMode === 1) {
            this.sending([this.pressedButton('MENU')]);
        }
        else {
            if (this.config.mac !== 'CA:TA:NI:CO:GA:TA') {
                this.macReceived = true;
            }
            if (this.config.autoIPMac === false || this.macReceived === true) {
                WOL.wake(this.config.mac, (err) => {
                    if (err) {
                        this.logInfo(`Could not wake up ${this.config.name}: ${err}`);
                        this.newPowerState(false);
                    }
                    this.logInfo(`${this.config.name} woke up!`);
                    this.newPowerState(true);
                    this.turnOffCommand = true;
                    this.scheduleTimeout(() => {
                        if (this.powerState === false) {
                            this.logInfo(`Startup time of 60 seconds expired, reverting state to offline`);
                        }
                    }, 60000);
                });
            }
            else {
                this.logInfo('IP and MAC addresses are not set yet, turn on the device')
            }
        }
    }
}
// Export internals for unit testing without affecting Homebridge runtime behavior.
module.exports.zidooAccessory = zidooAccessory;
module.exports.zidooPlatform = zidooPlatform;
module.exports._private = {
    BUTTON_KEY_SUFFIXES,
    COMMAND_NAME_MATCHES,
};
