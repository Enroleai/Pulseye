const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (socket, next) {
	if (socket.handshake.query && socket.handshake.query.token) {
		jwt.verify(
			socket.handshake.query.token,
			config.get('jwtPrivateKey'),
			function (err, decoded) {
				if (err) return next(new Error('Authentication error'));
				socket.decoded = decoded;
				// console.log(decoded, 'jwt'); ///later from soket js we can use socket.decoded ->{ _id: '5f339bb4046ef73eacf99990', isAdmin: true, iat: 1598549332 }
				next();
			}
		);
	} else {
		next(new Error('Authentication error'));
	}
};
