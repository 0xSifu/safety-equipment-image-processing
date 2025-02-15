<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Safety Equipment Detection API

## Overview
This API service analyzes images to detect personal protective equipment (PPE) worn by workers. It uses Azure Computer Vision to identify key safety equipment including:

- Safety Helmets/Hard Hats
- Work Uniforms/Safety Vests
- Protective Gloves
- Safety Boots

## Features

### PPE Detection
- Detects presence/absence of required safety equipment
- Identifies colors of equipment when possible
- Handles both full-body and partial (upper body) images
- Provides confidence-based detection

### Equipment Specifications

#### Safety Helmets
- Detects construction/safety helmets
- Common colors: Yellow, Blue
- Includes hard hats and protective headgear

#### Work Uniforms
- Detects safety vests and work uniforms
- Identifies reflective/high-visibility clothing
- Common colors: Orange, Red, Blue, Gray
- Includes both vests and full uniforms

#### Protective Gloves
- Detects safety and work gloves
- Common colors: Black, Gray
- Distinguishes from uniform colors

#### Safety Boots
- Detects work boots and safety footwear
- Only assessed when legs/feet are visible in image
- Common colors: Brown, Black
- Returns "unknown" for partial body images

### Response Format
The API returns structured data including:
- Total number of people detected
- Individual equipment status for each person
- Color information when available
- Confidence-based results

## Use Cases
- Safety compliance monitoring
- PPE verification
- Workplace safety audits
- Safety training verification

## Limitations
- Partial body images may not detect all equipment
- Color detection depends on lighting conditions
- Best results with clear, well-lit images
- Performance varies with image quality

## Future Improvements
- Enhanced color detection
- More detailed equipment classification
- Support for additional PPE types
- Custom training for specific equipment types

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
