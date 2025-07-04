<p align="center">
    <a href="https://screego.net">
        <img src="docs/logo.png" />
    </a>
</p>


<h1 align="center">screego/server</h1>
<p align="center"><i>screen sharing for developers</i></p>

<p align="center">
    <a href="https://github.com/breadchris/share/screenshare/actions?query=workflow%3Abuild">
        <img alt="Build Status" src="https://github.com/breadchris/share/screenshare/workflows/build/badge.svg">
    </a> 
    <a href="https://github.com/breadchris/share/screenshare/pkgs/container/server">
        <img alt="Build Status" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fipitio%2Fghcr-pulls%2Fmaster%2Findex.json&query=%24%5B%3F(%40.owner%3D%3D%22screego%22%20%26%26%20%40.repo%3D%3D%22server%22%20%26%26%20%40.image%3D%3D%22server%22)%5D.pulls&logo=github&label=pulls">
    </a> 
    <a href="https://goreportcard.com/report/github.com/breadchris/share/screenshare">
        <img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/breadchris/share/screenshare">
    </a>
    <a href="https://hub.docker.com/r/screego/server">
        <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/screego/server.svg">
    </a>
    <a href="https://github.com/breadchris/share/screenshare/releases/latest">
        <img alt="latest release" src="https://img.shields.io/github/release/screego/server.svg">
    </a>
</p>

## Intro

In the past I've had some problems sharing my screen with coworkers using
corporate chatting solutions like Microsoft Teams. I wanted to show them some
of my code, but either the stream lagged several seconds behind or the quality
was so poor that my colleagues couldn't read the code. Or both.

That's why I created screego. It allows you to share your screen with good
quality and low latency. Screego is an addition to existing software and 
only helps to share your screen. Nothing else (:.

## Features

* Multi User Screenshare
* Secure transfer via WebRTC
* Low latency / High resolution
* Simple Install via Docker / single binary
* Integrated TURN Server see [NAT Traversal](https://screego.net/#/nat-traversal)

[Demo / Public Instance](https://app.screego.net/) ᛫ [Installation](https://screego.net/#/install) ᛫ [Configuration](https://screego.net/#/config) 

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the
[tags on this repository](https://github.com/breadchris/share/screenshare/tags).
