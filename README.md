# Soundboardforce

*It may not be the app we deserve, but it is the app we need.*

There's a new app in town, and it will forever change the way you work. I don't know what it is, unfortunately. So in the meantime, enjoy Soundboardforce!

![Soundboardforce](/readme-extras/soundboardforce.gif)

Soundboardforce is an admittedly ridiculous app, but I think that's just what we need right now.

With Soundboardforce, you can send dumb sounds to your coworkers; you can send dumb sounds to your friends; you can send dumb sounds to your grandmother (if your grandmother is a user in the same Salesforce org as you and has been assigned the right permission set)!

Soundboardforce is a breath of fresh air, if a breath of fresh air were an application sitting in the Salesforce utility bar.

Click below to watch the highlights on the YouTube. The pickle is your friend (unless you make him angry. You won't like him when he's angry.)

[![YouTube link to Soundboardforce](http://img.youtube.com/vi/Pk0u4Vr65xw/0.jpg)](https://youtu.be/Pk0u4Vr65xw)

## Installation ##

**Install from the AppExchange**

Install Soundboardforce from the Salesforce AppExchange to take advantage of spiffy (yes, spiffy) package upgrades! *MOAR SOUNDS!?* You betcha! If I get to it!

https://appexchange.salesforce.com/appxListingDetail?listingId=a0N4V00000GXfCxUAL

**Install from this repository**

Push the code from this repository directly into your Salesforce sandbox or scratch org, then check out the section on [Hacking Soundboardforce](#Hacking-Soundboardforce!-–-Add-your-own-sounds!#) to learn how to add *MOAR SOUNDS!*

## Setup ##

### Permissions ###

A user must be assigned the Soundboardforce User permission set to use Soundboardforce. Any user who tries to use Soundboardforce without the required permission risks facing off against a dancing Mexican pickle. You have been forewarned.

![Screenshot of dancing Mexican pickle removed to avoid trauma](/readme-extras/removed-pickle.png)

### The Utility Bar ###

Soundboardforce is only accessible through an application's utility bar. Get to the utility bar settings of an app via the Setup menu: **Setup > Apps > App Manager**. Don't forget to check the *Start Automatically* checkbox.

![Add Soundboardforce to the Utility Bar](/readme-extras/utility-bar.png)

## Usage ##

### Configuration ###

![Soundboardforce toolbar](/readme-extras/settings.png)

<img src="./readme-extras/volume_high_60.png" width="32" height="32" style="vertical-align: middle; margin-bottom: 4px" />&nbsp; ***Turn on sound***
<br />
Click this button so Soundboardforce can play sounds! You won't hear anything (except for your own heavy breathing... or maybe *my* heavy breathing) if you don't click this button!

<img src="./readme-extras/question_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Allow anonymous senders***
<br />
Enjoy living on the edge? This button tells Soundboardforce to play sounds from anonymous senders! See [Sending sounds](#Sending-sounds#) to learn how to send sounds anonymously... like a criminal.

<img src="./readme-extras/chat_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Play sounds you send***
<br />
Click this button if you want Soundboardforce to play the sounds you've sent to others. You'll hear it when they hear it. Great for when you all want to laugh together! Ha ha? Ha.

<img src="./readme-extras/broadcast_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Play even if the tab does not have focus***
<br />
Busy with something else? That's no fun, but Soundboardforce won't distract you if the window is covered by another program. Click this button and Soundboardforce, like life, will find a way.

<img src="./readme-extras/groups_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Manage groups***
<br />
Only my mom sends sounds to one person at a time. Create groups of up to 30 people and send sounds to the entire group simultaneously! Only users with the Soundboardforce User permission set can be added to groups.

<img src="./readme-extras/adduser_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Allowlist***
<br />
Configure and enable an allowlist and Soundboardforce will restrict playing sounds to only people on that list. Being on an allowlist can be overridden by also being on a blocklist. Only users with the Soundboardforce User permission set can be added to the allowlist.

<img src="./readme-extras/block_visitor_60.png" width="32" height="32" style="vertical-align: middle" />&nbsp; ***Blocklist***
<br />
Configure and enable a blocklist and Soundboardforce won't play sounds coming from the people on that list. We've all got that one person... Ya, you know who I'm talking about. Adding someone to your blocklist takes precedence over them being on your allowlist. Only users with the Soundboardforce User permission set can be added to the blocklist.

### Sending sounds ###

![Soundboardforce "send to" picker](/readme-extras/send-to.png)

Click on the name at the bottom of Soundboardforce to change who you want to sends sounds to. When you first launch Soundboardforce, the name at the bottom is *You* (yes, you!), which means you're sending sounds to yourself. (Whatever works for ya!) You'll be able to search for and select any user in your org that has been granted the Soundboardforce User permission set. The same search will return any groups that you may have configured in the *Manage groups* panel. Select a group to tell Soundboardforce to send sounds to every user in that group.

You may want to send sounds without fear of reprisal. Click the question mark at the bottom-right of Soundboardforce to enable “anonymous mode”, and your name won't be associated with any sounds you send. Sound receivers need to have *Allow anonymous senders* enabled to hear those sounds, as described in the [Configuration](#Configuration) section.

### Translating Soundboardforce ###

Every iota of text visible in Soundboardforce is available for translation. Enable the Translation Workbench, then go to *Custom Labels* in Setup. You can translate everything from panel headings like “Manage groups” to button alt text. Soundboardgentlenudge. That's Soundboardforce in Canadian, eh?

## Hacking Soundboardforce – Add your own sounds! ##

More sounds are coming to Soundboardforce... eventually. If you'd rather not wait, you can add custom sounds yourself! You will lose the advantage of automatic upgrades through the managed package and you will have to push the code from the repository yourself, but you gotta do what you gotta do!

Complete the following steps to add a custom sound: (I will not be providing a mountain of detail)

1. Upload a new static resource with your sound
2. Upload a new static resource with the associated image. We at Soundboardforce Productions Inc Corp Ltd recommend a square image with sides 112 pixels in length. An image with different dimensions could (it will) create a blackhole and doom us all.
3. Time to get coding! Open `force-app\main\default\lwc\soundboard\sounds.js`.
4. Import your two new static resources.
5. Add a new entry to the exported list of sounds. Maintain a proper JSON structure. Don't forget your commas! (blackhole...)
6. Push your changes to your scratch org or sandbox and enjoy!

## Final thoughts ##

This was a fun app to make and I learned a lot while making it. Is it useful? This was a fun app to make and I learned a lot while making it.

<span style="font-size: .7em;">* Cough.. only tested in Chrome.. cough.</span>

<br />

***

*“Are you troubled by strange noises in the night? Must be Soundboardforce.”*

—Dr. Raymond Stantz, 1984