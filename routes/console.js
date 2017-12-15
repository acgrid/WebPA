const express = require('express'),
    router = express.Router();

/* Console */
router.get('/:channel', function(req, res) {
    const channel = req.param('channel', 'default'), debug = req.debug || false;
    res.render('console', { channel, debug });
});

module.exports = router;