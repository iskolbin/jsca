"use strict"

function Grid( w, h, initialValue ) {
	this.grid = [];
	this.width = w;
	this.height = h;
	for ( let x = 0; x < w; x++ ) {
		let row = [];
		for ( let y = 0; y < h; y++ ) {
			row[y] = initialValue;
		}
		this.grid[x] = row;
	}
}

Grid.prototype = {
	map: function(f,result_) {
		let result = (typeof(result_) == 'undefined') ? new Grid( this.width, this.height, false ) : result_;
		for ( let x = 0; x < this.width; x++ ) {
			for ( let y = 0; y < this.height; y++ ) {
				result.set( x, y, f( this.get(x,y), x, y ));
			}
		}
		return result;
	},

	forEach: function(f) {
		for ( let x = 0; x < this.width; x++ ) {
			for ( let y = 0; y < this.height; y++ ) {
				f( this.get(x,y), x, y );
			}
		}
	},
	
	getNeighborsNeimann1: function(x_,y_,n_) {
		let result = [];
		if ( x_ > 0 ) {
			if ( y_ > 0 ) {
				result.push( this.get(x_-1,y_-1));
			}
			if ( y_ < this.height-1 ) {
				result.push( this.get(x_-1,y_+1));
			}
		}

		if ( x_ < this.width-1 ) {
			if ( y_ > 0 ) {
				result.push( this.get(x_+1,y_-1));
			}
			if ( y_ < this.height-1 ) {
				result.push( this.get(x_+1,y_+1));
			}
		}
		return result;
	},

	getNeighborsMoore: function(x_,y_,n_) {
		let result = [];
		const n = ( typeof(n_) === "undefined" ) ? 1 : n_;
		const x0 = Math.max(0,x_-n);
		const x1 = Math.min(this.width,x_+n+1);
		const y0 = Math.max(0,y_-n);
		const y1 = Math.min(this.height,y_+n+1);
		for ( let x = x0; x < x1; x++ ) {
			for ( let y = y0; y < y1; y++ ) {
				if ( x !== x_ || y !== y_ ) {
					result.push( this.get(x,y));
				}
			}
		}
		return result;
	},

	get: function(x,y) {
		return this.grid[x][y];
	},

	set: function(x,y,v) {
		this.grid[x][y] = v;
	},

	inside: function(x,y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	},
}



function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}



function RenderBuffer( colors ) {
	this.colors = colors.map( x => x );
	this.buffers = {};
	this.counts = {};
	for ( let i = 0; i < colors.length; i++ ) {
		const color = colors[i];
		this.buffers[color] = [];
		this.counts[color] = 0;
	}
}

RenderBuffer.prototype = {
	clear: function() {
		for ( let k in this.counts ) {
			this.counts[k] = 0;
		}
	},

	add: function( color, x, y ) {
		const buffer = this.buffers[color];
		const count = this.counts[color];
		if ( count == buffer.length ) {
			buffer.push( x );
			buffer.push( y );
		} else {
			buffer[count] = x;
			buffer[count+1] = y;
		}
		this.counts[color] = count + 2;
	},

	render: function( context, cellw, cellh ) {
		for ( let i = 0; i < this.colors.length; i++ ) {
			const color = this.colors[i];
			const count = this.counts[color];
			if ( count ) {
				const buffer = this.buffers[color];

				context.beginPath();
				context.strokeStyle = color;
				for ( let i = 0; i < count; i += 2 ) {
					const x = buffer[i]*cellw;
					const y = buffer[i+1]*cellh;

					context.moveTo( x, y );
					context.lineTo( x + cellw, y + cellh );
					context.moveTo( x, y + cellh );
					context.lineTo( x + cellw, y );
				}
				context.stroke();
			}
		}
	}
}

// 0 -- free
// 1 -- tree
// 2 -- fire
function Forest( width, height, ignitionProbability, birthProbability ) {
	this.buffer0 = new Grid( width, height, 0 ).map( _ => [0,1,2][randomInt(0,2)] );
	this.buffer1 = this.buffer0.map( v => v );
	this.grid = this.buffer0;
	this.ignitionProbability = ignitionProbability;
	this.birthProbability = birthProbability;
	this.renderBuffer = new RenderBuffer( ['red','green'] );
}	

Forest.prototype = {
	update: function() {
		let buffer = (this.grid == this.buffer0) ? this.buffer1 : this.buffer0;
		this.grid = this.grid.map( (v,x,y) => {
			switch ( v ) {
				case 0: return ( Math.random() < this.birthProbability ) ? 1 : 0;
				case 1: return ( Math.random() < this.ignitionProbability || this.grid.getNeighborsMoore(x,y,1).filter( v => v == 2).length > 0) ? 2 : 1;
				case 2: return 0;
				default: return 0;
			}
		}, buffer)
	},

	render: function( context, cellw, cellh ) {
		const renderBuffer = this.renderBuffer;
		const grid = this.grid.grid;
		const width = this.grid.width;
		const height = this.grid.height;
		
		renderBuffer.clear();
		
		for ( let x = 0, x_ = 0; x < width; x++, x_ += w ) {
			for ( let y = 0, y_ = 0; y < height; y++, y_ += h ) {
				switch (grid[x][y]) {
					case 0: 
						break;
					case 1: 
						renderBuffer.add( 'green', x, y );
						break;
					case 2:
						renderBuffer.add( 'red', x, y );
						break;
				}
			}
		}

		renderBuffer.render( context, cellh, cellh );
	},	
}

Forest.prototype = {
	update: function() {
		let buffer = (this.grid == this.buffer0) ? this.buffer1 : this.buffer0;
		this.grid = this.grid.map( (v,x,y) => {
			switch ( v ) {
				case 0: return ( Math.random() < this.birthProbability ) ? 1 : 0;
				case 1: return ( Math.random() < this.ignitionProbability || this.grid.getNeighborsMoore(x,y,1).filter( v => v == 2).length > 0) ? 2 : 1;
				case 2: return 0;
				default: return 0;
			}
		}, buffer)
	},

	render: function( context, cellw, cellh ) {
		const renderBuffer = this.renderBuffer;
		const grid = this.grid.grid;
		const width = this.grid.width;
		const height = this.grid.height;
		
		renderBuffer.clear();
		
		for ( let x = 0, x_ = 0; x < width; x++, x_ += w ) {
			for ( let y = 0, y_ = 0; y < height; y++, y_ += h ) {
				switch (grid[x][y]) {
					case 0: 
						break;
					case 1: 
						renderBuffer.add( 'green', x, y );
						break;
					case 2:
						renderBuffer.add( 'red', x, y );
						break;
				}
			}
		}

		renderBuffer.render( context, cellh, cellh );
	},	
}


function MultiState( width, height, colors ) {
	let range = [];
	for ( let i = 0; i < colors.length; i++ ) {
		range.push( i );
	}
	
	this.buffer0 = new Grid( width, height, 0 ).map( _ => range[randomInt(0,range.length)] );
	this.buffer1 = this.buffer0.map( v => v );
	this.grid = this.buffer0;
	this.colors = colors;
	this.renderBuffer = new RenderBuffer( colors );
}	

MultiState.prototype = {
	update: function() {
		let buffer = (this.grid == this.buffer0) ? this.buffer1 : this.buffer0;
		const len = this.colors.length;
		this.grid = this.grid.map( (v,x,y) => (this.grid.getNeighborsNeimann1(x,y,1).indexOf((v+1)%len) >= 0 ) ? (v+1)%len : v, buffer );
	},

	render: function( context, cellw, cellh ) {
		const renderBuffer = this.renderBuffer;
		const grid = this.grid.grid;
		const width = this.grid.width;
		const height = this.grid.height;
		const colors = this.colors;

		renderBuffer.clear();
		
		for ( let x = 0, x_ = 0; x < width; x++, x_ += w ) {
			for ( let y = 0, y_ = 0; y < height; y++, y_ += h ) {
				renderBuffer.add( colors[grid[x][y]], x, y );
			}
		}

		renderBuffer.render( context, cellh, cellh );
	},	
}

if ( typeof(exports) !== "undefined" ) {
	exports.randomInt = randomInt;
	exports.Grid = Grid;
	exports.Forest = Forest;
	exports.MultiState = MultiState;
}

if ( typeof(window) !== "undefined" ) {
	window.CA = {
		Forest: Forest,
		MultiState: MultiState,
		Grid: Grid,
		randomInt: randomInt,
	};
}
