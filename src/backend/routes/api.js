const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
require('dotenv').config();
const { IPIFY_API_URL } = require('../../constant/constants'); 
const router = express.Router();
router.use(cookieParser());


router.post('/track-interaction', async (req, res) => {
  const interactionData = req.body;
  console.log('Received Interaction Data:', interactionData);

  let response = [];
  let isHuman = true;
  let info = {};
  let isBotBasedOnIP = false;


  try {
    const ipInfoUrl = IPIFY_API_URL;
    const ipInfoResponse = await axios.get(ipInfoUrl);
    const ipInfoData = ipInfoResponse.data;
    console.log(ipInfoData,"ipInfoData")
    info = {
      ip: ipInfoData.ip,
      city: ipInfoData.city,
      region: ipInfoData.region,
      country: ipInfoData.country,
      loc: ipInfoData.loc,
      timezone: ipInfoData.timezone,
    };
  } catch (error) {
    console.error('Error fetching IP information:', error);
  }

  for (let interaction of interactionData) {
    isHuman = true;

    if (interaction.mouseMovesCount < 10 || !isValidDirection(interaction.direction)) {
      isHuman = false;
    }

    // Check click patterns for each ad
    if (interaction.clickCount > 10 || isRapidClicking(interaction.clicks)) {
      isHuman = false;
    }

    // Check user agent for known bots for each ad
    if (isBotUserAgent(interaction.userAgent)) {
      isHuman = false;
    }

    // Additional check for IP-based bot detection
    if (isBotBasedOnIP) {
      isHuman = false;
    }

    // Store results for each ad
    response.push({
      adId: interaction.adId, // Using unique adId
      isHuman,
      interaction,
    });

    // Handle cookie status if the result has changed or if it's the first time detecting bot/human status
    const currentCookieStatus = req.cookies.isHuman;
    if (isHuman !== currentCookieStatus) {
      if (isHuman) {
        console.log('Human interaction detected for ad:', interaction.adId);
        res.cookie('isHuman', 'true', { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
      } else {
        console.log('Bot activity detected for ad:', interaction.adId);
        res.cookie('isHuman', 'false', { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
      }
    }
  }

  // Respond with the interaction status and data for all ads
  res.status(200).send({
    message: 'Data received for all ads',
    results: response,
    info,
    isHuman,
  });
});

// Function to validate the direction of mouse movements
function isValidDirection(direction) {
  return direction !== 'straight';
}

// Function to detect rapid clicking patterns
function isRapidClicking(clicks) {
  const timeThreshold = 300;
  for (let i = 1; i < clicks.length; i++) {
    if (new Date(clicks[i].timestamp) - new Date(clicks[i - 1].timestamp) < timeThreshold) {
      return true;
    }
  }
  return false;
}

// Function to check if the user agent belongs to a bot
function isBotUserAgent(userAgent) {
  const botPatterns = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 'Sogou', 'Facebot',
  ];
  return botPatterns.some(pattern => userAgent.includes(pattern));
}

module.exports = router;