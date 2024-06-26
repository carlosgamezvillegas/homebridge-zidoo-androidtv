<span align="center">

# homebridge-zidoo-androidtv
## HomeKit integration for Zidoo

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![homebridge-zidoo-androidtv](https://badgen.net/npm/v/homebridge-zidoo-androidtv?icon=npm)](https://www.npmjs.com/package/homebridge-zidoo-androidtv)
[![mit-license](https://badgen.net/npm/license/lodash)](https://github.com/merdok/homebridge-zidoo-androidtv/blob/master/LICENSE)
</span>

</span>

# What is this?

`homebrige-zidoo-androidtv` is a plugin for Homebridge to Control your Zidoo Z9X from your Home app. It should work with most Zidoo boxes.


### Features
* HomeKit "TV Remote"
* HomeKit automations
* Turn TV on/off
* Play, Pause, and Stop switches
### Optional Features
* Volume control (buttons or through iOS remote app) 
* Media control
* Movie Progress control
* Navegation Control (Stateless switches)
* Input control
* The rests of the Remote buttons (Stateless switches)

# Preparation
1. Connect the Zidoo device to the internet and get the IP address
2. To be able to turn on the devices it needds to be connected to the local network with an ethernet cable and get the LAN IP address and the LAN MAC address

# Installation
install using the following command in terminal:
```sh
npm i homebridge-zidoo-androidtv
```

# Configuration

Add the `zidooPlugin` platform in `config.json` in your home directory inside `.homebridge`.

Example configuration:

```js
{
  "platforms": [
    {
            "name": "Zidoo Z9X",
            "ip": "Youre IP Address", 
            "mac": "LAN MAC address", 
            "pollingInterval": 1000,
            "modelName": "Z9X",
            "manufacturer": "Zidoo Inc",
            "serialN": "B210U71647033894",
            "autoIPMac": false,
            "mediaButtons": false,
            "inputButtons":false,
            "movieControl": false,
            "<NameOfTheButton>": false,
            "newPlatformUUID":false,
            "platform": "zidooPlugin"
}
]
}
```

### Adding the Zidoo to the Home app
Since HomeKit expects only one Zidoo per bridge they will be declared as external accessories and acts as a bridge.  
This means that a device will not appear in your Home app until you add it!

To add the Zidoo to HomeKit follow this steps:

1. Open the Home <img src="https://user-images.githubusercontent.com/3979615/78010622-4ea1d380-738e-11ea-8a17-e6a465eeec35.png" height="16.42px"> app on your device.
2. Tap the Home tab, then tap <img src="https://user-images.githubusercontent.com/3979615/78010869-9aed1380-738e-11ea-9644-9f46b3633026.png" height="16.42px">.
3. Tap *Add Accessory*, and select *I Don't Have a Code or Cannot Scan* or *More Options...* whichever is available.
4. Select the accessory you want to pair.
5. Enter the Homebridge PIN, this can be found under the QR code in Homebridge UI or your Homebridge logs, alternatively you can select *Use Camera* and scan the QR code again.

For more info check the homebridge wiki [Connecting Homebridge To HomeKit](https://github.com/homebridge/homebridge/wiki/Connecting-Homebridge-To-HomeKit).

### Configuration
#### Platform Configuration fields
- `platform` [required]
Should always be **"zidooPlugin"**.
#### TV Configuration fields
- `name` [required]
Name of your Zidoo.
- `ip` [required]
ip address of your TV.
- `pollingInterval` [optional]
The TV state background polling interval in seconds. **Default: 10000**
- `modelName` [optional]
Model name of your device
- `manufacturer` [optional]
The manufcturer of your device.
- `serialN` [optional]
Serial Number of your device.
Set the IP address manually. Use this option if the device cannot be found automatically. **Default: false**
- `mediaButtons` [optional]
Allows control the playback state of your device. **Default: false**
- `NameOfTheButton` [optional]
Adds the button you want to add and can add as many as you want (refer to the button list bellow). **Default: false**

Button Name List is :
- cursorUpB
- cursorDownB 
- cursorLeftB
- cursorRightB
- cursorEnterB
- homeMenuB
- backButtonB
- infoB
- popUpMenuB
- redB
- yellowB
- blueB
- greenB
- audioB
- subtitleB
- repeatB 
- pipB 
- resolutionB
- muteB
- recordB
- movieB
- musicB 
- photoB
- fileB
- lightB
- screenshotB
- appSwitchB
  


Note: You can add  buttons in the "Navagation Buttons" and "other Buttons" in Settings using Homebridge UI
- `newPlatformUUID` [optional]
Enable this if you do not see the accessory when you try to add it to the Home App after deleting it. It will also create a different accesssory every time you chage the Name of the device in Settings. If an old accessory already exists in the Home App you will have to remove it manually. **Default: false**

## Troubleshooting
If you have any issues with the plugin or Zidoo services then you can run homebridge in debug mode, which will provide some additional information. This might be useful for debugging issues.

Homebridge debug mode:
```sh
homebridge -D
```

Deep debug log, add the following to your config.json:
```json
"deepDebugLog": true
```
This will enable additional extra log which might be helpful to debug all kind of issues. Just be aware that this will produce a lot of log information so it is recommended to use a service like https://pastebin.com/ when providing the log for inspection.

Note: Controls won't update if the plugin does not receive a confirmation message from the device.

## Known Issues
Turning on the Zidoo device only works by Wake up On Land (WOL), so the device needs an ethernet connection in order to gain full control of the Zidoo device.

If Homebridge is restared the IP and MAC addresses are going to be lost so the devices needs to be turned on manually to recapture the IP and MAC addresses 

## Special thanks
To Fernando for his patience and support.

If you have any suggestions/improvements please let know.

Enjoy!!
