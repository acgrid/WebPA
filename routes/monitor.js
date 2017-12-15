const express = require('express'),
    router = express.Router();

/* Monitor */
router.get('/:channel', function(req, res) {
    const channel = req.param('channel', 'default'), debug = req.debug || false;
    res.render('monitor', { channel, debug });
});

module.exports = router;