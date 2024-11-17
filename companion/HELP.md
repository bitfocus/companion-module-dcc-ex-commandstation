# companion-module-dcc-ex-commandstation

A companion module for model railway control using DCC.

This module will allow you to control a [DCC-EX CommandStation](https://dcc-ex.com/index.html) using a StreamDeck. This combination makes it very easy to make a dynamic and fully customisable push-button DCC controller. It is similar in concept to web/app throttles but uses a relatively cheap hardware interface. Any button can send one or more commands to the CommandStation-EX. Buttons can be arranged in multiple pages, allowing for example one page for each loco.

## Requirements
This is the setup I use, many other combinations of hardware will work.

* CommandStation-EX (version 5) running with a network connection
  * [Follow these instructions](https://dcc-ex.com/get-started/index.html)
* Network connection between CommandStation-EX and Companion (both on same LAN)
* An instance of the DCC-EX module running in Companion
  * Enter the IP address of the Arduino running CommandStation
* StreamDeck controller connected by USB to computer running Companion

## Version History

### Version 1.0.0
* First Release

### Version 2.0.0
* Updated for Companion 3
* Add selected loco variable
* Add loco throttle variables
* Add power, join and selected address feedback
* Add function presets
