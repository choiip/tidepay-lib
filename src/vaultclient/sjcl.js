"use strict";
var sjcl = {
    cipher: {},
    hash: {},
    keyexchange: {},
    mode: {},
    misc: {},
    codec: {},
    exception: {
        corrupt: function(a) {
            this.toString = function() {
                return "CORRUPT: " + this.message
            };
            this.message = a
        },
        invalid: function(a) {
            this.toString = function() {
                return "INVALID: " + this.message
            };
            this.message = a
        },
        bug: function(a) {
            this.toString = function() {
                return "BUG: " + this.message
            };
            this.message = a
        },
        notReady: function(a) {
            this.toString = function() {
                return "NOT READY: " + this.message
            };
            this.message = a
        }
    }
};
sjcl.cipher.aes = function(h) {
    if (!this._tables[0][0][0]) {
        this._precompute()
    }
    var d, c, e, g, l, f = this._tables[0][4],
        k = this._tables[1],
        a = h.length,
        b = 1;
    if (a !== 4 && a !== 6 && a !== 8) {
        throw new sjcl.exception.invalid("invalid aes key size")
    }
    this._key = [g = h.slice(0), l = []];
    for (d = a; d < 4 * a + 28; d++) {
        e = g[d - 1];
        if (d % a === 0 || (a === 8 && d % a === 4)) {
            e = f[e >>> 24] << 24 ^ f[e >> 16 & 255] << 16 ^ f[e >> 8 & 255] << 8 ^ f[e & 255];
            if (d % a === 0) {
                e = e << 8 ^ e >>> 24 ^ b << 24;
                b = b << 1 ^ (b >> 7) * 283
            }
        }
        g[d] = g[d - a] ^ e
    }
    for (c = 0; d; c++, d--) {
        e = g[c & 3 ? d : d - 4];
        if (d <= 4 || c < 4) {
            l[c] = e
        } else {
            l[c] = k[0][f[e >>> 24]] ^ k[1][f[e >> 16 & 255]] ^ k[2][f[e >> 8 & 255]] ^ k[3][f[e & 255]]
        }
    }
};
sjcl.cipher.aes.prototype = {
    encrypt: function(a) {
        return this._crypt(a, 0)
    },
    decrypt: function(a) {
        return this._crypt(a, 1)
    },
    _tables: [
        [
            [],
            [],
            [],
            [],
            []
        ],
        [
            [],
            [],
            [],
            [],
            []
        ]
    ],
    _precompute: function() {
        var j = this._tables[0],
            q = this._tables[1],
            h = j[4],
            n = q[4],
            g, l, f, k = [],
            c = [],
            b, p, m, o, e, a;
        for (g = 0; g < 0x100; g++) {
            c[(k[g] = g << 1 ^ (g >> 7) * 283) ^ g] = g
        }
        for (l = f = 0; !h[l]; l ^= b || 1, f = c[f] || 1) {
            o = f ^ f << 1 ^ f << 2 ^ f << 3 ^ f << 4;
            o = o >> 8 ^ o & 255 ^ 99;
            h[l] = o;
            n[o] = l;
            m = k[p = k[b = k[l]]];
            a = m * 0x1010101 ^ p * 0x10001 ^ b * 0x101 ^ l * 0x1010100;
            e = k[o] * 0x101 ^ o * 0x1010100;
            for (g = 0; g < 4; g++) {
                j[g][l] = e = e << 24 ^ e >>> 8;
                q[g][o] = a = a << 24 ^ a >>> 8
            }
        }
        for (g = 0; g < 5; g++) {
            j[g] = j[g].slice(0);
            q[g] = q[g].slice(0)
        }
    },
    _crypt: function(k, n) {
        if (k.length !== 4) {
            throw new sjcl.exception.invalid("invalid aes block size")
        }
        var y = this._key[n],
            v = k[0] ^ y[0],
            u = k[n ? 3 : 1] ^ y[1],
            t = k[2] ^ y[2],
            s = k[n ? 1 : 3] ^ y[3],
            w, e, m, x = y.length / 4 - 2,
            p, o = 4,
            q = [0, 0, 0, 0],
            r = this._tables[n],
            j = r[0],
            h = r[1],
            g = r[2],
            f = r[3],
            l = r[4];
        for (p = 0; p < x; p++) {
            w = j[v >>> 24] ^ h[u >> 16 & 255] ^ g[t >> 8 & 255] ^ f[s & 255] ^ y[o];
            e = j[u >>> 24] ^ h[t >> 16 & 255] ^ g[s >> 8 & 255] ^ f[v & 255] ^ y[o + 1];
            m = j[t >>> 24] ^ h[s >> 16 & 255] ^ g[v >> 8 & 255] ^ f[u & 255] ^ y[o + 2];
            s = j[s >>> 24] ^ h[v >> 16 & 255] ^ g[u >> 8 & 255] ^ f[t & 255] ^ y[o + 3];
            o += 4;
            v = w;
            u = e;
            t = m
        }
        for (p = 0; p < 4; p++) {
            q[n ? 3 & -p : p] = l[v >>> 24] << 24 ^ l[u >> 16 & 255] << 16 ^ l[t >> 8 & 255] << 8 ^ l[s & 255] ^ y[o++];
            w = v;
            v = u;
            u = t;
            t = s;
            s = w
        }
        return q
    }
};
sjcl.bitArray = {
    bitSlice: function(b, c, d) {
        b = sjcl.bitArray._shiftRight(b.slice(c / 32), 32 - (c & 31)).slice(1);
        return (d === undefined) ? b : sjcl.bitArray.clamp(b, d - c)
    },
    extract: function(c, d, f) {
        var b, e = Math.floor((-d - f) & 31);
        if ((d + f - 1 ^ d) & -32) {
            b = (c[d / 32 | 0] << (32 - e)) ^ (c[d / 32 + 1 | 0] >>> e)
        } else {
            b = c[d / 32 | 0] >>> e
        }
        return b & ((1 << f) - 1)
    },
    concat: function(c, a) {
        if (c.length === 0 || a.length === 0) {
            return c.concat(a)
        }
        var d = c[c.length - 1],
            b = sjcl.bitArray.getPartial(d);
        if (b === 32) {
            return c.concat(a)
        } else {
            return sjcl.bitArray._shiftRight(a, b, d | 0, c.slice(0, c.length - 1))
        }
    },
    bitLength: function(d) {
        var c = d.length,
            b;
        if (c === 0) {
            return 0
        }
        b = d[c - 1];
        return (c - 1) * 32 + sjcl.bitArray.getPartial(b)
    },
    clamp: function(d, b) {
        if (d.length * 32 < b) {
            return d
        }
        d = d.slice(0, Math.ceil(b / 32));
        var c = d.length;
        b = b & 31;
        if (c > 0 && b) {
            d[c - 1] = sjcl.bitArray.partial(b, d[c - 1] & 2147483648 >> (b - 1), 1)
        }
        return d
    },
    partial: function(b, a, c) {
        if (b === 32) {
            return a
        }
        return (c ? a | 0 : a << (32 - b)) + b * 0x10000000000
    },
    getPartial: function(a) {
        return Math.round(a / 0x10000000000) || 32
    },
    equal: function(e, d) {
        if (sjcl.bitArray.bitLength(e) !== sjcl.bitArray.bitLength(d)) {
            return false
        }
        var c = 0,
            f;
        for (f = 0; f < e.length; f++) {
            c |= e[f] ^ d[f]
        }
        return (c === 0)
    },
    _shiftRight: function(d, c, h, f) {
        var g, b = 0,
            e;
        if (f === undefined) {
            f = []
        }
        for (; c >= 32; c -= 32) {
            f.push(h);
            h = 0
        }
        if (c === 0) {
            return f.concat(d)
        }
        for (g = 0; g < d.length; g++) {
            f.push(h | d[g] >>> c);
            h = d[g] << (32 - c)
        }
        b = d.length ? d[d.length - 1] : 0;
        e = sjcl.bitArray.getPartial(b);
        f.push(sjcl.bitArray.partial(c + e & 31, (c + e > 32) ? h : f.pop(), 1));
        return f
    },
    _xor4: function(a, b) {
        return [a[0] ^ b[0], a[1] ^ b[1], a[2] ^ b[2], a[3] ^ b[3]]
    },
    byteswapM: function(c) {
        var e, d, b = 0xff00;
        for (e = 0; e < c.length; ++e) {
            d = c[e];
            c[e] = (d >>> 24) | ((d >>> 8) & b) | ((d & b) << 8) | (d << 24)
        }
        return c
    }
};
sjcl.codec.utf8String = {
    fromBits: function(a) {
        var b = "",
            e = sjcl.bitArray.bitLength(a),
            d, c;
        for (d = 0; d < e / 8; d++) {
            if ((d & 3) === 0) {
                c = a[d / 4]
            }
            b += String.fromCharCode(c >>> 24);
            c <<= 8
        }
        return decodeURIComponent(escape(b))
    },
    toBits: function(d) {
        d = unescape(encodeURIComponent(d));
        var a = [],
            c, b = 0;
        for (c = 0; c < d.length; c++) {
            b = b << 8 | d.charCodeAt(c);
            if ((c & 3) === 3) {
                a.push(b);
                b = 0
            }
        }
        if (c & 3) {
            a.push(sjcl.bitArray.partial(8 * (c & 3), b))
        }
        return a
    }
};
sjcl.codec.hex = {
    fromBits: function(a) {
        var b = "",
            c;
        for (c = 0; c < a.length; c++) {
            b += ((a[c] | 0) + 0xf00000000000).toString(16).substr(4)
        }
        return b.substr(0, sjcl.bitArray.bitLength(a) / 4)
    },
    toBits: function(d) {
        var c, b = [],
            a;
        d = d.replace(/\s|0x/g, "");
        a = d.length;
        d = d + "00000000";
        for (c = 0; c < d.length; c += 8) {
            b.push(parseInt(d.substr(c, 8), 16) ^ 0)
        }
        return sjcl.bitArray.clamp(b, a * 4)
    }
};
sjcl.codec.base32 = {
    _chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    _hexChars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    BITS: 32,
    BASE: 5,
    REMAINING: 27,
    fromBits: function(h, n, g) {
        var l = sjcl.codec.base32.BITS,
            a = sjcl.codec.base32.BASE,
            j = sjcl.codec.base32.REMAINING;
        var d = "",
            f, m = 0,
            k = sjcl.codec.base32._chars,
            e = 0,
            b = sjcl.bitArray.bitLength(h);
        if (g) {
            k = sjcl.codec.base32._hexChars
        }
        for (f = 0; d.length * a < b;) {
            d += k.charAt((e ^ h[f] >>> m) >>> j);
            if (m < a) {
                e = h[f] << (a - m);
                m += j;
                f++
            } else {
                e <<= a;
                m -= a
            }
        }
        while ((d.length & 7) && !n) {
            d += "="
        }
        return d
    },
    toBits: function(l, g) {
        l = l.replace(/\s|=/g, "").toUpperCase();
        var o = sjcl.codec.base32.BITS,
            a = sjcl.codec.base32.BASE,
            j = sjcl.codec.base32.REMAINING;
        var b = [],
            f, p = 0,
            k = sjcl.codec.base32._chars,
            d = 0,
            m, n = "base32";
        if (g) {
            k = sjcl.codec.base32._hexChars;
            n = "base32hex"
        }
        for (f = 0; f < l.length; f++) {
            m = k.indexOf(l.charAt(f));
            if (m < 0) {
                if (!g) {
                    try {
                        return sjcl.codec.base32hex.toBits(l)
                    } catch (h) {}
                }
                throw new sjcl.exception.invalid("this isn't " + n + "!")
            }
            if (p > j) {
                p -= j;
                b.push(d ^ m >>> p);
                d = m << (o - p)
            } else {
                p += a;
                d ^= m << (o - p)
            }
        }
        if (p & 56) {
            b.push(sjcl.bitArray.partial(p & 56, d, 1))
        }
        return b
    }
};
sjcl.codec.base32hex = {
    fromBits: function(a, b) {
        return sjcl.codec.base32.fromBits(a, b, 1)
    },
    toBits: function(a) {
        return sjcl.codec.base32.toBits(a, 1)
    }
};
sjcl.codec.base64 = {
    _chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    fromBits: function(g, k, b) {
        var d = "",
            e, j = 0,
            h = sjcl.codec.base64._chars,
            f = 0,
            a = sjcl.bitArray.bitLength(g);
        if (b) {
            h = h.substr(0, 62) + "-_"
        }
        for (e = 0; d.length * 6 < a;) {
            d += h.charAt((f ^ g[e] >>> j) >>> 26);
            if (j < 6) {
                f = g[e] << (6 - j);
                j += 26;
                e++
            } else {
                f <<= 6;
                j -= 6
            }
        }
        while ((d.length & 3) && !k) {
            d += "="
        }
        return d
    },
    toBits: function(h, f) {
        h = h.replace(/\s|=/g, "");
        var d = [],
            e, g = 0,
            j = sjcl.codec.base64._chars,
            b = 0,
            a;
        if (f) {
            j = j.substr(0, 62) + "-_"
        }
        for (e = 0; e < h.length; e++) {
            a = j.indexOf(h.charAt(e));
            if (a < 0) {
                throw new sjcl.exception.invalid("this isn't base64!")
            }
            if (g > 26) {
                g -= 26;
                d.push(b ^ a >>> g);
                b = a << (32 - g)
            } else {
                g += 6;
                b ^= a << (32 - g)
            }
        }
        if (g & 56) {
            d.push(sjcl.bitArray.partial(g & 56, b, 1))
        }
        return d
    }
};
sjcl.codec.base64url = {
    fromBits: function(a) {
        return sjcl.codec.base64.fromBits(a, 1, 1)
    },
    toBits: function(a) {
        return sjcl.codec.base64.toBits(a, 1)
    }
};
sjcl.codec.bytes = {
    fromBits: function(a) {
        var b = [],
            e = sjcl.bitArray.bitLength(a),
            d, c;
        for (d = 0; d < e / 8; d++) {
            if ((d & 3) === 0) {
                c = a[d / 4]
            }
            b.push(c >>> 24);
            c <<= 8
        }
        return b
    },
    toBits: function(a) {
        var b = [],
            d, c = 0;
        for (d = 0; d < a.length; d++) {
            c = c << 8 | a[d];
            if ((d & 3) === 3) {
                b.push(c);
                c = 0
            }
        }
        if (d & 3) {
            b.push(sjcl.bitArray.partial(8 * (d & 3), c))
        }
        return b
    }
};
sjcl.codec.z85 = {
    _chars: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#",
    _byteMap: [0, 68, 0, 84, 83, 82, 72, 0, 75, 76, 70, 65, 0, 63, 62, 69, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 64, 0, 73, 66, 74, 71, 81, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 77, 0, 78, 67, 0, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 79, 0, 80, 0, 0],
    fromBits: function(k) {
        if (!k) {
            return null
        }
        if (0 !== sjcl.bitArray.bitLength(k) % 32) {
            throw new sjcl.exception.invalid("Invalid bitArray length!")
        }
        var e = "",
            l = sjcl.codec.z85._chars;
        for (var h = 0; h < k.length; ++h) {
            var a = k[h];
            var m = 0;
            for (var f = 0; f < 4; ++f) {
                var d = (a >>> 8 * (4 - f - 1)) & 255;
                m = m * 0x100 + d
            }
            var b = 85 * 85 * 85 * 85;
            while (b) {
                e += l.charAt(Math.floor(m / b) % 85);
                b = Math.floor(b / 85)
            }
        }
        var g = k.length * 5;
        if (e.length !== g) {
            throw new sjcl.exception.invalid("Bad Z85 conversion!")
        }
        return e
    },
    toBits: function(g) {
        if (!g) {
            return []
        }
        if (0 !== g.length % 5) {
            throw new sjcl.exception.invalid("Invalid Z85 string!")
        }
        var b = [],
            e = 0,
            d = sjcl.codec.z85._byteMap;
        var f = 0,
            a = 0;
        for (var c = 0; c < g.length;) {
            e = e * 85 + d[g[c++].charCodeAt(0) - 32];
            if (0 === c % 5) {
                var h = 0x100 * 0x100 * 0x100;
                while (h) {
                    f = (f * Math.pow(2, 8)) + (Math.floor(e / h) % 0x100);
                    ++a;
                    if (4 === a) {
                        b.push(f);
                        f = 0, a = 0
                    }
                    h = Math.floor(h / 0x100)
                }
                e = 0
            }
        }
        return b
    }
};
sjcl.hash.sha256 = function(a) {
    if (!this._key[0]) {
        this._precompute()
    }
    if (a) {
        this._h = a._h.slice(0);
        this._buffer = a._buffer.slice(0);
        this._length = a._length
    } else {
        this.reset()
    }
};
sjcl.hash.sha256.hash = function(a) {
    return (new sjcl.hash.sha256()).update(a).finalize()
};
sjcl.hash.sha256.prototype = {
    blockSize: 512,
    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this
    },
    update: function(h) {
        if (typeof h === "string") {
            h = sjcl.codec.utf8String.toBits(h)
        }
        var g, a = this._buffer = sjcl.bitArray.concat(this._buffer, h),
            f = this._length,
            d = this._length = f + sjcl.bitArray.bitLength(h);
        if (d > 0x1fffffffffffff) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits")
        }
        if (typeof Uint32Array !== "undefined") {
            var k = new Uint32Array(a);
            var e = 0;
            for (g = 512 + f - ((512 + f) & 0x1ff); g <= d; g += 512) {
                this._block(k.subarray(16 * e, 16 * (e + 1)));
                e += 1
            }
            a.splice(0, 16 * e)
        } else {
            for (g = 512 + f - ((512 + f) & 0x1ff); g <= d; g += 512) {
                this._block(a.splice(0, 16))
            }
        }
        return this
    },
    finalize: function() {
        var c, a = this._buffer,
            d = this._h;
        a = sjcl.bitArray.concat(a, [sjcl.bitArray.partial(1, 1)]);
        for (c = a.length + 2; c & 15; c++) {
            a.push(0)
        }
        a.push(Math.floor(this._length / 0x100000000));
        a.push(this._length | 0);
        while (a.length) {
            this._block(a.splice(0, 16))
        }
        this.reset();
        return d
    },
    _init: [],
    _key: [],
    _precompute: function() {
        var d = 0,
            c = 2,
            b, e;

        function a(f) {
            return (f - Math.floor(f)) * 0x100000000 | 0
        }
        for (; d < 64; c++) {
            e = true;
            for (b = 2; b * b <= c; b++) {
                if (c % b === 0) {
                    e = false;
                    break
                }
            }
            if (e) {
                if (d < 8) {
                    this._init[d] = a(Math.pow(c, 1 / 2))
                }
                this._key[d] = a(Math.pow(c, 1 / 3));
                d++
            }
        }
    },
    _block: function(t) {
        var e, f, s, r, j = this._h,
            c = this._key,
            q = j[0],
            p = j[1],
            o = j[2],
            n = j[3],
            m = j[4],
            l = j[5],
            g = j[6],
            d = j[7];
        for (e = 0; e < 64; e++) {
            if (e < 16) {
                f = t[e]
            } else {
                s = t[(e + 1) & 15];
                r = t[(e + 14) & 15];
                f = t[e & 15] = ((s >>> 7 ^ s >>> 18 ^ s >>> 3 ^ s << 25 ^ s << 14) + (r >>> 17 ^ r >>> 19 ^ r >>> 10 ^ r << 15 ^ r << 13) + t[e & 15] + t[(e + 9) & 15]) | 0
            }
            f = (f + d + (m >>> 6 ^ m >>> 11 ^ m >>> 25 ^ m << 26 ^ m << 21 ^ m << 7) + (g ^ m & (l ^ g)) + c[e]);
            d = g;
            g = l;
            l = m;
            m = n + f | 0;
            n = o;
            o = p;
            p = q;
            q = (f + ((p & o) ^ (n & (p ^ o))) + (p >>> 2 ^ p >>> 13 ^ p >>> 22 ^ p << 30 ^ p << 19 ^ p << 10)) | 0
        }
        j[0] = j[0] + q | 0;
        j[1] = j[1] + p | 0;
        j[2] = j[2] + o | 0;
        j[3] = j[3] + n | 0;
        j[4] = j[4] + m | 0;
        j[5] = j[5] + l | 0;
        j[6] = j[6] + g | 0;
        j[7] = j[7] + d | 0
    }
};
sjcl.hash.sha512 = function(a) {
    if (!this._key[0]) {
        this._precompute()
    }
    if (a) {
        this._h = a._h.slice(0);
        this._buffer = a._buffer.slice(0);
        this._length = a._length
    } else {
        this.reset()
    }
};
sjcl.hash.sha512.hash = function(a) {
    return (new sjcl.hash.sha512()).update(a).finalize()
};
sjcl.hash.sha512.prototype = {
    blockSize: 1024,
    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this
    },
    update: function(h) {
        if (typeof h === "string") {
            h = sjcl.codec.utf8String.toBits(h)
        }
        var g, a = this._buffer = sjcl.bitArray.concat(this._buffer, h),
            f = this._length,
            d = this._length = f + sjcl.bitArray.bitLength(h);
        if (d > 0x1fffffffffffff) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits")
        }
        if (typeof Uint32Array !== "undefined") {
            var k = new Uint32Array(a);
            var e = 0;
            for (g = 1024 + f - ((1024 + f) & 1023); g <= d; g += 1024) {
                this._block(k.subarray(32 * e, 32 * (e + 1)));
                e += 1
            }
            a.splice(0, 32 * e)
        } else {
            for (g = 1024 + f - ((1024 + f) & 1023); g <= d; g += 1024) {
                this._block(a.splice(0, 32))
            }
        }
        return this
    },
    finalize: function() {
        var c, a = this._buffer,
            d = this._h;
        a = sjcl.bitArray.concat(a, [sjcl.bitArray.partial(1, 1)]);
        for (c = a.length + 4; c & 31; c++) {
            a.push(0)
        }
        a.push(0);
        a.push(0);
        a.push(Math.floor(this._length / 0x100000000));
        a.push(this._length | 0);
        while (a.length) {
            this._block(a.splice(0, 32))
        }
        this.reset();
        return d
    },
    _init: [],
    _initr: [12372232, 13281083, 9762859, 1914609, 15106769, 4090911, 4308331, 8266105],
    _key: [],
    _keyr: [2666018, 15689165, 5061423, 9034684, 4764984, 380953, 1658779, 7176472, 197186, 7368638, 14987916, 16757986, 8096111, 1480369, 13046325, 6891156, 15813330, 5187043, 9229749, 11312229, 2818677, 10937475, 4324308, 1135541, 6741931, 11809296, 16458047, 15666916, 11046850, 698149, 229999, 945776, 13774844, 2541862, 12856045, 9810911, 11494366, 7844520, 15576806, 8533307, 15795044, 4337665, 16291729, 5553712, 15684120, 6662416, 7413802, 12308920, 13816008, 4303699, 9366425, 10176680, 13195875, 4295371, 6546291, 11712675, 15708924, 1519456, 15772530, 6568428, 6495784, 8568297, 13007125, 7492395, 2515356, 12632583, 14740254, 7262584, 1535930, 13146278, 16321966, 1853211, 294276, 13051027, 13221564, 1051980, 4080310, 6651434, 14088940, 4675607],
    _precompute: function() {
        var d = 0,
            c = 2,
            b, e;

        function a(g) {
            return (g - Math.floor(g)) * 0x100000000 | 0
        }

        function f(g) {
            return (g - Math.floor(g)) * 0x10000000000 & 255
        }
        for (; d < 80; c++) {
            e = true;
            for (b = 2; b * b <= c; b++) {
                if (c % b === 0) {
                    e = false;
                    break
                }
            }
            if (e) {
                if (d < 8) {
                    this._init[d * 2] = a(Math.pow(c, 1 / 2));
                    this._init[d * 2 + 1] = (f(Math.pow(c, 1 / 2)) << 24) | this._initr[d]
                }
                this._key[d * 2] = a(Math.pow(c, 1 / 3));
                this._key[d * 2 + 1] = (f(Math.pow(c, 1 / 3)) << 24) | this._keyr[d];
                d++
            }
        }
    },
    _block: function(aq) {
        var ag, an, ae, aj = this._h,
            ac = this._key,
            g = aj[0],
            d = aj[1],
            aa = aj[2],
            W = aj[3],
            E = aj[4],
            C = aj[5],
            n = aj[6],
            e = aj[7],
            ah = aj[8],
            Y = aj[9],
            H = aj[10],
            D = aj[11],
            q = aj[12],
            l = aj[13],
            al = aj[14],
            ab = aj[15];
        var S;
        if (typeof Uint32Array !== "undefined") {
            S = Array(160);
            for (var ad = 0; ad < 32; ad++) {
                S[ad] = aq[ad]
            }
        } else {
            S = aq
        }
        var s = g,
            m = d,
            ao = aa,
            af = W,
            K = E,
            F = C,
            u = n,
            p = e,
            ap = ah,
            ak = Y,
            M = H,
            I = D,
            v = q,
            r = l,
            ar = al,
            am = ab;
        for (ag = 0; ag < 80; ag++) {
            if (ag < 16) {
                an = S[ag * 2];
                ae = S[ag * 2 + 1]
            } else {
                var R = S[(ag - 15) * 2];
                var Q = S[(ag - 15) * 2 + 1];
                var o = ((Q << 31) | (R >>> 1)) ^ ((Q << 24) | (R >>> 8)) ^ (R >>> 7);
                var f = ((R << 31) | (Q >>> 1)) ^ ((R << 24) | (Q >>> 8)) ^ ((R << 25) | (Q >>> 7));
                var N = S[(ag - 2) * 2];
                var J = S[(ag - 2) * 2 + 1];
                var ai = ((J << 13) | (N >>> 19)) ^ ((N << 3) | (J >>> 29)) ^ (N >>> 6);
                var Z = ((N << 13) | (J >>> 19)) ^ ((J << 3) | (N >>> 29)) ^ ((N << 26) | (J >>> 6));
                var L = S[(ag - 7) * 2];
                var G = S[(ag - 7) * 2 + 1];
                var X = S[(ag - 16) * 2];
                var U = S[(ag - 16) * 2 + 1];
                ae = f + G;
                an = o + L + ((ae >>> 0) < (f >>> 0) ? 1 : 0);
                ae += Z;
                an += ai + ((ae >>> 0) < (Z >>> 0) ? 1 : 0);
                ae += U;
                an += X + ((ae >>> 0) < (U >>> 0) ? 1 : 0)
            }
            S[ag * 2] = an |= 0;
            S[ag * 2 + 1] = ae |= 0;
            var B = (ap & M) ^ (~ap & v);
            var z = (ak & I) ^ (~ak & r);
            var V = (s & ao) ^ (s & K) ^ (ao & K);
            var T = (m & af) ^ (m & F) ^ (af & F);
            var a = ((m << 4) | (s >>> 28)) ^ ((s << 30) | (m >>> 2)) ^ ((s << 25) | (m >>> 7));
            var at = ((s << 4) | (m >>> 28)) ^ ((m << 30) | (s >>> 2)) ^ ((m << 25) | (s >>> 7));
            var P = ((ak << 18) | (ap >>> 14)) ^ ((ak << 14) | (ap >>> 18)) ^ ((ap << 23) | (ak >>> 9));
            var O = ((ap << 18) | (ak >>> 14)) ^ ((ap << 14) | (ak >>> 18)) ^ ((ak << 23) | (ap >>> 9));
            var x = ac[ag * 2];
            var t = ac[ag * 2 + 1];
            var y = am + O;
            var A = ar + P + ((y >>> 0) < (am >>> 0) ? 1 : 0);
            y += z;
            A += B + ((y >>> 0) < (z >>> 0) ? 1 : 0);
            y += t;
            A += x + ((y >>> 0) < (t >>> 0) ? 1 : 0);
            y = y + ae | 0;
            A += an + ((y >>> 0) < (ae >>> 0) ? 1 : 0);
            var b = at + T;
            var c = a + V + ((b >>> 0) < (at >>> 0) ? 1 : 0);
            ar = v;
            am = r;
            v = M;
            r = I;
            M = ap;
            I = ak;
            ak = (p + y) | 0;
            ap = (u + A + ((ak >>> 0) < (p >>> 0) ? 1 : 0)) | 0;
            u = K;
            p = F;
            K = ao;
            F = af;
            ao = s;
            af = m;
            m = (y + b) | 0;
            s = (A + c + ((m >>> 0) < (y >>> 0) ? 1 : 0)) | 0
        }
        d = aj[1] = (d + m) | 0;
        aj[0] = (g + s + ((d >>> 0) < (m >>> 0) ? 1 : 0)) | 0;
        W = aj[3] = (W + af) | 0;
        aj[2] = (aa + ao + ((W >>> 0) < (af >>> 0) ? 1 : 0)) | 0;
        C = aj[5] = (C + F) | 0;
        aj[4] = (E + K + ((C >>> 0) < (F >>> 0) ? 1 : 0)) | 0;
        e = aj[7] = (e + p) | 0;
        aj[6] = (n + u + ((e >>> 0) < (p >>> 0) ? 1 : 0)) | 0;
        Y = aj[9] = (Y + ak) | 0;
        aj[8] = (ah + ap + ((Y >>> 0) < (ak >>> 0) ? 1 : 0)) | 0;
        D = aj[11] = (D + I) | 0;
        aj[10] = (H + M + ((D >>> 0) < (I >>> 0) ? 1 : 0)) | 0;
        l = aj[13] = (l + r) | 0;
        aj[12] = (q + v + ((l >>> 0) < (r >>> 0) ? 1 : 0)) | 0;
        ab = aj[15] = (ab + am) | 0;
        aj[14] = (al + ar + ((ab >>> 0) < (am >>> 0) ? 1 : 0)) | 0
    }
};
sjcl.hash.sha1 = function(a) {
    if (a) {
        this._h = a._h.slice(0);
        this._buffer = a._buffer.slice(0);
        this._length = a._length
    } else {
        this.reset()
    }
};
sjcl.hash.sha1.hash = function(a) {
    return (new sjcl.hash.sha1()).update(a).finalize()
};
sjcl.hash.sha1.prototype = {
    blockSize: 512,
    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this
    },
    update: function(h) {
        if (typeof h === "string") {
            h = sjcl.codec.utf8String.toBits(h)
        }
        var g, a = this._buffer = sjcl.bitArray.concat(this._buffer, h),
            f = this._length,
            d = this._length = f + sjcl.bitArray.bitLength(h);
        if (d > 0x1fffffffffffff) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits")
        }
        if (typeof Uint32Array !== "undefined") {
            var k = new Uint32Array(a);
            var e = 0;
            for (g = this.blockSize + f - ((this.blockSize + f) & (this.blockSize - 1)); g <= d; g += this.blockSize) {
                this._block(k.subarray(16 * e, 16 * (e + 1)));
                e += 1
            }
            a.splice(0, 16 * e)
        } else {
            for (g = this.blockSize + f - ((this.blockSize + f) & (this.blockSize - 1)); g <= d; g += this.blockSize) {
                this._block(a.splice(0, 16))
            }
        }
        return this
    },
    finalize: function() {
        var c, a = this._buffer,
            d = this._h;
        a = sjcl.bitArray.concat(a, [sjcl.bitArray.partial(1, 1)]);
        for (c = a.length + 2; c & 15; c++) {
            a.push(0)
        }
        a.push(Math.floor(this._length / 0x100000000));
        a.push(this._length | 0);
        while (a.length) {
            this._block(a.splice(0, 16))
        }
        this.reset();
        return d
    },
    _init: [1732584193, 4023233417, 2562383102, 271733878, 3285377520],
    _key: [1518500249, 1859775393, 2400959708, 3395469782],
    _f: function(e, a, g, f) {
        if (e <= 19) {
            return (a & g) | (~a & f)
        } else {
            if (e <= 39) {
                return a ^ g ^ f
            } else {
                if (e <= 59) {
                    return (a & g) | (a & f) | (g & f)
                } else {
                    if (e <= 79) {
                        return a ^ g ^ f
                    }
                }
            }
        }
    },
    _S: function(b, a) {
        return (a << b) | (a >>> 32 - b)
    },
    _block: function(n) {
        var r, g, p, o, m, l, k, i = this._h;
        var q;
        if (typeof Uint32Array !== "undefined") {
            q = Array(80);
            for (var f = 0; f < 16; f++) {
                q[f] = n[f]
            }
        } else {
            q = n
        }
        p = i[0];
        o = i[1];
        m = i[2];
        l = i[3];
        k = i[4];
        for (r = 0; r <= 79; r++) {
            if (r >= 16) {
                q[r] = this._S(1, q[r - 3] ^ q[r - 8] ^ q[r - 14] ^ q[r - 16])
            }
            g = (this._S(5, p) + this._f(r, o, m, l) + k + q[r] + this._key[Math.floor(r / 20)]) | 0;
            k = l;
            l = m;
            m = this._S(30, o);
            o = p;
            p = g
        }
        i[0] = (i[0] + p) | 0;
        i[1] = (i[1] + o) | 0;
        i[2] = (i[2] + m) | 0;
        i[3] = (i[3] + l) | 0;
        i[4] = (i[4] + k) | 0
    }
};
sjcl.mode.ccm = {
    name: "ccm",
    _progressListeners: [],
    listenProgress: function(a) {
        sjcl.mode.ccm._progressListeners.push(a)
    },
    unListenProgress: function(a) {
        var b = sjcl.mode.ccm._progressListeners.indexOf(a);
        if (b > -1) {
            sjcl.mode.ccm._progressListeners.splice(b, 1)
        }
    },
    _callProgressListener: function(c) {
        var b = sjcl.mode.ccm._progressListeners.slice(),
            a;
        for (a = 0; a < b.length; a += 1) {
            b[a](c)
        }
    },
    encrypt: function(c, b, e, j, d) {
        var h, f = b.slice(0),
            k, i = sjcl.bitArray,
            a = i.bitLength(e) / 8,
            g = i.bitLength(f) / 8;
        d = d || 64;
        j = j || [];
        if (a < 7) {
            throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")
        }
        for (h = 2; h < 4 && g >>> 8 * h; h++) {}
        if (h < 15 - a) {
            h = 15 - a
        }
        e = i.clamp(e, 8 * (15 - h));
        k = sjcl.mode.ccm._computeTag(c, b, e, j, d, h);
        f = sjcl.mode.ccm._ctrMode(c, f, e, k, d, h);
        return i.concat(f.data, f.tag)
    },
    decrypt: function(b, c, e, l, d) {
        d = d || 64;
        l = l || [];
        var h, j = sjcl.bitArray,
            a = j.bitLength(e) / 8,
            g = j.bitLength(c),
            f = j.clamp(c, g - d),
            k = j.bitSlice(c, g - d),
            i;
        g = (g - d) / 8;
        if (a < 7) {
            throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")
        }
        for (h = 2; h < 4 && g >>> 8 * h; h++) {}
        if (h < 15 - a) {
            h = 15 - a
        }
        e = j.clamp(e, 8 * (15 - h));
        f = sjcl.mode.ccm._ctrMode(b, f, e, k, d, h);
        i = sjcl.mode.ccm._computeTag(b, f.data, e, l, d, h);
        if (!j.equal(f.tag, i)) {
            throw new sjcl.exception.corrupt("ccm: tag doesn't match")
        }
        return f.data
    },
    _macAdditionalData: function(b, m, d, c, j, k) {
        var h, f, e, a = [],
            l = sjcl.bitArray,
            g = l._xor4;
        h = [l.partial(8, (m.length ? 1 << 6 : 0) | (c - 2) << 2 | k - 1)];
        h = l.concat(h, d);
        h[3] |= j;
        h = b.encrypt(h);
        if (m.length) {
            f = l.bitLength(m) / 8;
            if (f <= 65279) {
                a = [l.partial(16, f)]
            } else {
                if (f <= 0xffffffff) {
                    a = l.concat([l.partial(16, 65534)], [f])
                }
            }
            a = l.concat(a, m);
            for (e = 0; e < a.length; e += 4) {
                h = b.encrypt(g(h, a.slice(e, e + 4).concat([0, 0, 0])))
            }
        }
        return h
    },
    _computeTag: function(b, a, d, k, c, h) {
        var g, e, j = sjcl.bitArray,
            f = j._xor4;
        c /= 8;
        if (c % 2 || c < 4 || c > 16) {
            throw new sjcl.exception.invalid("ccm: invalid tag length")
        }
        if (k.length > 0xffffffff || a.length > 0xffffffff) {
            throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data")
        }
        g = sjcl.mode.ccm._macAdditionalData(b, k, d, c, j.bitLength(a) / 8, h);
        for (e = 0; e < a.length; e += 4) {
            g = b.encrypt(f(g, a.slice(e, e + 4).concat([0, 0, 0])))
        }
        return j.clamp(g, c * 8)
    },
    _ctrMode: function(e, k, h, s, g, q) {
        var j, m, r = sjcl.bitArray,
            o = r._xor4,
            d, f = k.length,
            c = r.bitLength(k),
            b = f / 50,
            a = b;
        d = r.concat([r.partial(8, q - 1)], h).concat([0, 0, 0]).slice(0, 4);
        s = r.bitSlice(o(s, e.encrypt(d)), 0, g);
        if (!f) {
            return {
                tag: s,
                data: []
            }
        }
        for (m = 0; m < f; m += 4) {
            if (m > b) {
                sjcl.mode.ccm._callProgressListener(m / f);
                b += a
            }
            d[3]++;
            j = e.encrypt(d);
            k[m] ^= j[0];
            k[m + 1] ^= j[1];
            k[m + 2] ^= j[2];
            k[m + 3] ^= j[3]
        }
        return {
            tag: s,
            data: r.clamp(k, c)
        }
    }
};
if (sjcl.beware === undefined) {
    sjcl.beware = {}
}
sjcl.beware["CTR mode is dangerous because it doesn't protect message integrity."] = function() {
    sjcl.mode.ctr = {
        name: "ctr",
        encrypt: function(d, c, a, b) {
            return sjcl.mode.ctr._calculate(d, c, a, b)
        },
        decrypt: function(d, c, a, b) {
            return sjcl.mode.ctr._calculate(d, c, a, b)
        },
        _calculate: function(b, j, g, p) {
            var f, a, n, o, m, k, h;
            if (p && p.length) {
                throw new sjcl.exception.invalid("ctr can't authenticate data")
            }
            if (sjcl.bitArray.bitLength(g) !== 128) {
                throw new sjcl.exception.invalid("ctr iv must be 128 bits")
            }
            if (!(f = j.length)) {
                return []
            }
            o = g.slice(0);
            m = j.slice(0);
            a = sjcl.bitArray.bitLength(m);
            for (h = 0; h < f; h += 4) {
                k = b.encrypt(o);
                m[h] ^= k[0];
                m[h + 1] ^= k[1];
                m[h + 2] ^= k[2];
                m[h + 3] ^= k[3];
                o[3]++
            }
            return sjcl.bitArray.clamp(m, a)
        }
    }
};
if (sjcl.beware === undefined) {
    sjcl.beware = {}
}
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."] = function() {
    sjcl.mode.cbc = {
        name: "cbc",
        encrypt: function(h, b, e, k) {
            if (k && k.length) {
                throw new sjcl.exception.invalid("cbc can't authenticate data")
            }
            if (sjcl.bitArray.bitLength(e) !== 128) {
                throw new sjcl.exception.invalid("cbc iv must be 128 bits")
            }
            var f, j = sjcl.bitArray,
                g = j._xor4,
                d = j.bitLength(b),
                a = 0,
                c = [];
            if (d & 7) {
                throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte")
            }
            for (f = 0; a + 128 <= d; f += 4, a += 128) {
                e = h.encrypt(g(e, b.slice(f, f + 4)));
                c.splice(f, 0, e[0], e[1], e[2], e[3])
            }
            d = (16 - ((d >> 3) & 15)) * 0x1010101;
            e = h.encrypt(g(e, j.concat(b, [d, d, d, d]).slice(f, f + 4)));
            c.splice(f, 0, e[0], e[1], e[2], e[3]);
            return c
        },
        decrypt: function(h, c, d, k) {
            if (k && k.length) {
                throw new sjcl.exception.invalid("cbc can't authenticate data")
            }
            if (sjcl.bitArray.bitLength(d) !== 128) {
                throw new sjcl.exception.invalid("cbc iv must be 128 bits")
            }
            if ((sjcl.bitArray.bitLength(c) & 127) || !c.length) {
                throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size")
            }
            var f, j = sjcl.bitArray,
                g = j._xor4,
                e, a, b = [];
            k = k || [];
            for (f = 0; f < c.length; f += 4) {
                e = c.slice(f, f + 4);
                a = g(d, h.decrypt(e));
                b.splice(f, 0, a[0], a[1], a[2], a[3]);
                d = e
            }
            e = b[f - 1] & 255;
            if (e === 0 || e > 16) {
                throw new sjcl.exception.corrupt("pkcs#5 padding corrupt")
            }
            a = e * 0x1010101;
            if (!j.equal(j.bitSlice([a, a, a, a], 0, e * 8), j.bitSlice(b, b.length * 32 - e * 8, b.length * 32))) {
                throw new sjcl.exception.corrupt("pkcs#5 padding corrupt")
            }
            return j.bitSlice(b, 0, b.length * 32 - e * 8)
        }
    }
};
sjcl.mode.ocb2 = {
    name: "ocb2",
    encrypt: function(o, a, g, q, e, l) {
        if (sjcl.bitArray.bitLength(g) !== 128) {
            throw new sjcl.exception.invalid("ocb iv must be 128 bits")
        }
        var h, m = sjcl.mode.ocb2._times2,
            n = sjcl.bitArray,
            j = n._xor4,
            k = [0, 0, 0, 0],
            p = m(o.encrypt(g)),
            f, c, b = [],
            d;
        q = q || [];
        e = e || 64;
        for (h = 0; h + 4 < a.length; h += 4) {
            f = a.slice(h, h + 4);
            k = j(k, f);
            b = b.concat(j(p, o.encrypt(j(p, f))));
            p = m(p)
        }
        f = a.slice(h);
        c = n.bitLength(f);
        d = o.encrypt(j(p, [0, 0, 0, c]));
        f = n.clamp(j(f.concat([0, 0, 0]), d), c);
        k = j(k, j(f.concat([0, 0, 0]), d));
        k = o.encrypt(j(k, j(p, m(p))));
        if (q.length) {
            k = j(k, l ? q : sjcl.mode.ocb2.pmac(o, q))
        }
        return b.concat(n.concat(f, n.clamp(k, e)))
    },
    decrypt: function(p, d, g, r, e, m) {
        if (sjcl.bitArray.bitLength(g) !== 128) {
            throw new sjcl.exception.invalid("ocb iv must be 128 bits")
        }
        e = e || 64;
        var h, n = sjcl.mode.ocb2._times2,
            o = sjcl.bitArray,
            j = o._xor4,
            l = [0, 0, 0, 0],
            q = n(p.encrypt(g)),
            f, b, k = sjcl.bitArray.bitLength(d) - e,
            a = [],
            c;
        r = r || [];
        for (h = 0; h + 4 < k / 32; h += 4) {
            f = j(q, p.decrypt(j(q, d.slice(h, h + 4))));
            l = j(l, f);
            a = a.concat(f);
            q = n(q)
        }
        b = k - h * 32;
        c = p.encrypt(j(q, [0, 0, 0, b]));
        f = j(c, o.clamp(d.slice(h), b).concat([0, 0, 0]));
        l = j(l, f);
        l = p.encrypt(j(l, j(q, n(q))));
        if (r.length) {
            l = j(l, m ? r : sjcl.mode.ocb2.pmac(p, r))
        }
        if (!o.equal(o.clamp(l, e), o.bitSlice(d, k))) {
            throw new sjcl.exception.corrupt("ocb: tag doesn't match")
        }
        return a.concat(o.clamp(f, b))
    },
    pmac: function(f, j) {
        var b, e = sjcl.mode.ocb2._times2,
            g = sjcl.bitArray,
            c = g._xor4,
            d = [0, 0, 0, 0],
            h = f.encrypt([0, 0, 0, 0]),
            a;
        h = c(h, e(e(h)));
        for (b = 0; b + 4 < j.length; b += 4) {
            h = e(h);
            d = c(d, f.encrypt(c(h, j.slice(b, b + 4))))
        }
        a = j.slice(b);
        if (g.bitLength(a) < 128) {
            h = c(h, e(h));
            a = g.concat(a, [2147483648 | 0, 0, 0, 0])
        }
        d = c(d, a);
        return f.encrypt(c(e(c(h, e(h))), d))
    },
    _times2: function(a) {
        return [a[0] << 1 ^ a[1] >>> 31, a[1] << 1 ^ a[2] >>> 31, a[2] << 1 ^ a[3] >>> 31, a[3] << 1 ^ (a[0] >>> 31) * 135]
    }
};
sjcl.mode.ocb2progressive = {
    createEncryptor: function(m, e, p, c, k) {
        if (sjcl.bitArray.bitLength(e) !== 128) {
            throw new sjcl.exception.invalid("ocb iv must be 128 bits")
        }
        var f, l = sjcl.mode.ocb2._times2,
            n = sjcl.bitArray,
            h = n._xor4,
            j = [0, 0, 0, 0],
            o = l(m.encrypt(e)),
            d, a, g = [],
            b;
        p = p || [];
        c = c || 64;
        return {
            process: function(q) {
                var r = sjcl.bitArray.bitLength(q);
                if (r == 0) {
                    return []
                }
                var i = [];
                g = g.concat(q);
                for (f = 0; f + 4 < g.length; f += 4) {
                    d = g.slice(f, f + 4);
                    j = h(j, d);
                    i = i.concat(h(o, m.encrypt(h(o, d))));
                    o = l(o)
                }
                g = g.slice(f);
                return i
            },
            finalize: function() {
                d = g;
                a = n.bitLength(d);
                b = m.encrypt(h(o, [0, 0, 0, a]));
                d = n.clamp(h(d.concat([0, 0, 0]), b), a);
                j = h(j, h(d.concat([0, 0, 0]), b));
                j = m.encrypt(h(j, h(o, l(o))));
                if (p.length) {
                    j = h(j, k ? p : sjcl.mode.ocb2.pmac(m, p))
                }
                return n.concat(d, n.clamp(j, c))
            }
        }
    },
    createDecryptor: function(m, e, p, c, k) {
        if (sjcl.bitArray.bitLength(e) !== 128) {
            throw new sjcl.exception.invalid("ocb iv must be 128 bits")
        }
        c = c || 64;
        var f, l = sjcl.mode.ocb2._times2,
            n = sjcl.bitArray,
            h = n._xor4,
            j = [0, 0, 0, 0],
            o = l(m.encrypt(e)),
            d, a, g = [],
            b;
        p = p || [];
        return {
            process: function(q) {
                if (q.length == 0) {
                    return []
                }
                var i = [];
                g = g.concat(q);
                var r = sjcl.bitArray.bitLength(g);
                for (f = 0; f + 4 < (r - c) / 32; f += 4) {
                    d = h(o, m.decrypt(h(o, g.slice(f, f + 4))));
                    j = h(j, d);
                    i = i.concat(d);
                    o = l(o)
                }
                g = g.slice(f);
                return i
            },
            finalize: function() {
                a = sjcl.bitArray.bitLength(g) - c;
                b = m.encrypt(h(o, [0, 0, 0, a]));
                d = h(b, n.clamp(g, a).concat([0, 0, 0]));
                j = h(j, d);
                j = m.encrypt(h(j, h(o, l(o))));
                if (p.length) {
                    j = h(j, k ? p : sjcl.mode.ocb2.pmac(m, p))
                }
                if (!n.equal(n.clamp(j, c), n.bitSlice(g, a))) {
                    throw new sjcl.exception.corrupt("ocb: tag doesn't match")
                }
                return n.clamp(d, a)
            }
        }
    }
};
sjcl.mode.gcm = {
    name: "gcm",
    encrypt: function(h, g, c, e, d) {
        var b, f = g.slice(0),
            a = sjcl.bitArray;
        d = d || 128;
        e = e || [];
        b = sjcl.mode.gcm._ctrMode(true, h, f, e, c, d);
        return a.concat(b.data, b.tag)
    },
    decrypt: function(a, c, e, i, d) {
        var f, g = c.slice(0),
            j, h = sjcl.bitArray,
            b = h.bitLength(g);
        d = d || 128;
        i = i || [];
        if (d <= b) {
            j = h.bitSlice(g, b - d);
            g = h.bitSlice(g, 0, b - d)
        } else {
            j = g;
            g = []
        }
        f = sjcl.mode.gcm._ctrMode(false, a, g, i, e, d);
        if (!h.equal(f.tag, j)) {
            throw new sjcl.exception.corrupt("gcm: tag doesn't match")
        }
        return f.data
    },
    _galoisMultiply: function(k, g) {
        var c, b, f, a, e, h, l = sjcl.bitArray,
            d = l._xor4;
        a = [0, 0, 0, 0];
        e = g.slice(0);
        for (c = 0; c < 128; c++) {
            f = (k[Math.floor(c / 32)] & (1 << (31 - c % 32))) !== 0;
            if (f) {
                a = d(a, e)
            }
            h = (e[3] & 1) !== 0;
            for (b = 3; b > 0; b--) {
                e[b] = (e[b] >>> 1) | ((e[b - 1] & 1) << 31)
            }
            e[0] = e[0] >>> 1;
            if (h) {
                e[0] = e[0] ^ (225 << 24)
            }
        }
        return a
    },
    _ghash: function(c, f, e) {
        var d, b, a = e.length;
        d = f.slice(0);
        for (b = 0; b < a; b += 4) {
            d[0] ^= 0xffffffff & e[b];
            d[1] ^= 0xffffffff & e[b + 1];
            d[2] ^= 0xffffffff & e[b + 2];
            d[3] ^= 0xffffffff & e[b + 3];
            d = sjcl.mode.gcm._galoisMultiply(d, c)
        }
        return d
    },
    _ctrMode: function(m, k, t, q, e, a) {
        var j, c, f, d, p, r, u, g, n, b, o, s, h = sjcl.bitArray;
        n = t.length;
        b = h.bitLength(t);
        o = h.bitLength(q);
        s = h.bitLength(e);
        j = k.encrypt([0, 0, 0, 0]);
        if (s === 96) {
            c = e.slice(0);
            c = h.concat(c, [1])
        } else {
            c = sjcl.mode.gcm._ghash(j, [0, 0, 0, 0], e);
            c = sjcl.mode.gcm._ghash(j, c, [0, 0, Math.floor(s / 0x100000000), s & 0xffffffff])
        }
        f = sjcl.mode.gcm._ghash(j, [0, 0, 0, 0], q);
        r = c.slice(0);
        u = f.slice(0);
        if (!m) {
            u = sjcl.mode.gcm._ghash(j, f, t)
        }
        for (p = 0; p < n; p += 4) {
            r[3]++;
            d = k.encrypt(r);
            t[p] ^= d[0];
            t[p + 1] ^= d[1];
            t[p + 2] ^= d[2];
            t[p + 3] ^= d[3]
        }
        t = h.clamp(t, b);
        if (m) {
            u = sjcl.mode.gcm._ghash(j, f, t)
        }
        g = [Math.floor(o / 0x100000000), o & 0xffffffff, Math.floor(b / 0x100000000), b & 0xffffffff];
        u = sjcl.mode.gcm._ghash(j, u, g);
        d = k.encrypt(c);
        u[0] ^= d[0];
        u[1] ^= d[1];
        u[2] ^= d[2];
        u[3] ^= d[3];
        return {
            tag: h.bitSlice(u, 0, a),
            data: t
        }
    }
};
sjcl.misc.hmac = function(d, e) {
    this._hash = e = e || sjcl.hash.sha256;
    var c = [
            [],
            []
        ],
        b, a = e.prototype.blockSize / 32;
    this._baseHash = [new e(), new e()];
    if (d.length > a) {
        d = e.hash(d)
    }
    for (b = 0; b < a; b++) {
        c[0][b] = d[b] ^ 909522486;
        c[1][b] = d[b] ^ 1549556828
    }
    this._baseHash[0].update(c[0]);
    this._baseHash[1].update(c[1]);
    this._resultHash = new e(this._baseHash[0])
};
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function(a) {
    if (!this._updated) {
        this.update(a);
        return this.digest(a)
    } else {
        throw new sjcl.exception.invalid("encrypt on already updated hmac called!")
    }
};
sjcl.misc.hmac.prototype.reset = function() {
    this._resultHash = new this._hash(this._baseHash[0]);
    this._updated = false
};
sjcl.misc.hmac.prototype.update = function(a) {
    this._updated = true;
    this._resultHash.update(a)
};
sjcl.misc.hmac.prototype.digest = function() {
    var b = this._resultHash.finalize(),
        a = new(this._hash)(this._baseHash[1]).update(b).finalize();
    this.reset();
    return a
};
sjcl.misc.pbkdf2 = function(o, h, l, a, q) {
    l = l || 10000;
    if (a < 0 || l < 0) {
        throw new sjcl.exception.invalid("invalid params to pbkdf2")
    }
    if (typeof o === "string") {
        o = sjcl.codec.utf8String.toBits(o)
    }
    if (typeof h === "string") {
        h = sjcl.codec.utf8String.toBits(h)
    }
    q = q || sjcl.misc.hmac;
    var c = new q(o),
        p, n, g, f, d, e = [],
        m = sjcl.bitArray;
    for (d = 1; 32 * e.length < (a || 1); d++) {
        p = n = c.encrypt(m.concat(h, [d]));
        for (g = 1; g < l; g++) {
            n = c.encrypt(n);
            for (f = 0; f < n.length; f++) {
                p[f] ^= n[f]
            }
        }
        e = e.concat(p)
    }
    if (a) {
        e = m.clamp(e, a)
    }
    return e
};
sjcl.misc.scrypt = function(l, g, j, b, c, d, n) {
    var k = Math.pow(2, 32) - 1,
        m = sjcl.misc.scrypt;
    j = j || 16384;
    b = b || 8;
    c = c || 1;
    if (b * c >= Math.pow(2, 30)) {
        throw sjcl.exception.invalid("The parameters r, p must satisfy r * p < 2^30")
    }
    if ((j < 2) || (j & (j - 1) != 0)) {
        throw sjcl.exception.invalid("The parameter N must be a power of 2.")
    }
    if (j > k / 128 / b) {
        throw sjcl.exception.invalid("N too big.")
    }
    if (b > k / 128 / c) {
        throw sjcl.exception.invalid("r too big.")
    }
    var a = sjcl.misc.pbkdf2(l, g, 1, c * 128 * b * 8, n),
        h = a.length / c;
    m.reverse(a);
    for (var f = 0; f < c; f++) {
        var e = a.slice(f * h, (f + 1) * h);
        m.blockcopy(m.ROMix(e, j), 0, a, f * h)
    }
    m.reverse(a);
    return sjcl.misc.pbkdf2(l, a, 1, d, n)
};
sjcl.misc.scrypt.salsa20Core = function(e, b) {
    var d = function(g, f) {
        return (g << f) | (g >>> (32 - f))
    };
    var a = e.slice(0);
    for (var c = b; c > 0; c -= 2) {
        a[4] ^= d(a[0] + a[12], 7);
        a[8] ^= d(a[4] + a[0], 9);
        a[12] ^= d(a[8] + a[4], 13);
        a[0] ^= d(a[12] + a[8], 18);
        a[9] ^= d(a[5] + a[1], 7);
        a[13] ^= d(a[9] + a[5], 9);
        a[1] ^= d(a[13] + a[9], 13);
        a[5] ^= d(a[1] + a[13], 18);
        a[14] ^= d(a[10] + a[6], 7);
        a[2] ^= d(a[14] + a[10], 9);
        a[6] ^= d(a[2] + a[14], 13);
        a[10] ^= d(a[6] + a[2], 18);
        a[3] ^= d(a[15] + a[11], 7);
        a[7] ^= d(a[3] + a[15], 9);
        a[11] ^= d(a[7] + a[3], 13);
        a[15] ^= d(a[11] + a[7], 18);
        a[1] ^= d(a[0] + a[3], 7);
        a[2] ^= d(a[1] + a[0], 9);
        a[3] ^= d(a[2] + a[1], 13);
        a[0] ^= d(a[3] + a[2], 18);
        a[6] ^= d(a[5] + a[4], 7);
        a[7] ^= d(a[6] + a[5], 9);
        a[4] ^= d(a[7] + a[6], 13);
        a[5] ^= d(a[4] + a[7], 18);
        a[11] ^= d(a[10] + a[9], 7);
        a[8] ^= d(a[11] + a[10], 9);
        a[9] ^= d(a[8] + a[11], 13);
        a[10] ^= d(a[9] + a[8], 18);
        a[12] ^= d(a[15] + a[14], 7);
        a[13] ^= d(a[12] + a[15], 9);
        a[14] ^= d(a[13] + a[12], 13);
        a[15] ^= d(a[14] + a[13], 18)
    }
    for (c = 0; c < 16; c++) {
        e[c] = a[c] + e[c]
    }
};
sjcl.misc.scrypt.blockMix = function(e) {
    var f = e.slice(-16),
        c = [],
        a = e.length / 16,
        b = sjcl.misc.scrypt;
    for (var d = 0; d < a; d++) {
        b.blockxor(e, 16 * d, f, 0, 16);
        b.salsa20Core(f, 8);
        if ((d & 1) == 0) {
            b.blockcopy(f, 0, c, 8 * d)
        } else {
            b.blockcopy(f, 0, c, 8 * (d ^ 1 + a))
        }
    }
    return c
};
sjcl.misc.scrypt.ROMix = function(f, e) {
    var g = f.slice(0),
        a = [],
        b = sjcl.misc.scrypt;
    for (var d = 0; d < e; d++) {
        a.push(g.slice(0));
        g = b.blockMix(g)
    }
    for (d = 0; d < e; d++) {
        var c = g[g.length - 16] & (e - 1);
        b.blockxor(a[c], 0, g, 0);
        g = b.blockMix(g)
    }
    return g
};
sjcl.misc.scrypt.reverse = function(c) {
    for (var b in c) {
        var a = c[b] & 255;
        a = (a << 8) | (c[b] >>> 8) & 255;
        a = (a << 8) | (c[b] >>> 16) & 255;
        a = (a << 8) | (c[b] >>> 24) & 255;
        c[b] = a
    }
};
sjcl.misc.scrypt.blockcopy = function(c, d, f, e, a) {
    var b;
    a = a || (c.length - d);
    for (b = 0; b < a; b++) {
        f[e + b] = c[d + b] | 0
    }
};
sjcl.misc.scrypt.blockxor = function(c, d, f, e, a) {
    var b;
    a = a || (c.length - d);
    for (b = 0; b < a; b++) {
        f[e + b] = (f[e + b] ^ c[d + b]) | 0
    }
};
sjcl.prng = function(a) {
    this._pools = [new sjcl.hash.sha256()];
    this._poolEntropy = [0];
    this._reseedCount = 0;
    this._robins = {};
    this._eventId = 0;
    this._collectorIds = {};
    this._collectorIdNext = 0;
    this._strength = 0;
    this._poolStrength = 0;
    this._nextReseed = 0;
    this._key = [0, 0, 0, 0, 0, 0, 0, 0];
    this._counter = [0, 0, 0, 0];
    this._cipher = undefined;
    this._defaultParanoia = a;
    this._collectorsStarted = false;
    this._callbacks = {
        progress: {},
        seeded: {}
    };
    this._callbackI = 0;
    this._NOT_READY = 0;
    this._READY = 1;
    this._REQUIRES_RESEED = 2;
    this._MAX_WORDS_PER_BURST = 0x10000;
    this._PARANOIA_LEVELS = [0, 48, 64, 96, 128, 192, 0x100, 384, 512, 768, 1024];
    this._MILLISECONDS_PER_RESEED = 30000;
    this._BITS_PER_RESEED = 80
};
sjcl.prng.prototype = {
    randomWords: function(a, f) {
        var b = [],
            d, c = this.isReady(f),
            e;
        if (c === this._NOT_READY) {
            throw new sjcl.exception.notReady("generator isn't seeded")
        } else {
            if (c & this._REQUIRES_RESEED) {
                this._reseedFromPools(!(c & this._READY))
            }
        }
        for (d = 0; d < a; d += 4) {
            if ((d + 1) % this._MAX_WORDS_PER_BURST === 0) {
                this._gate()
            }
            e = this._gen4words();
            b.push(e[0], e[1], e[2], e[3])
        }
        this._gate();
        return b.slice(0, a)
    },
    setDefaultParanoia: function(b, a) {
        if (b === 0 && a !== "Setting paranoia=0 will ruin your security; use it only for testing") {
            throw new sjcl.exception.invalid("Setting paranoia=0 will ruin your security; use it only for testing")
        }
        this._defaultParanoia = b
    },
    addEntropy: function(e, l, a) {
        a = a || "user";
        var b, f, g, j = (new Date()).valueOf(),
            c = this._robins[a],
            k = this.isReady(),
            d = 0,
            h;
        b = this._collectorIds[a];
        if (b === undefined) {
            b = this._collectorIds[a] = this._collectorIdNext++
        }
        if (c === undefined) {
            c = this._robins[a] = 0
        }
        this._robins[a] = (this._robins[a] + 1) % this._pools.length;
        switch (typeof(e)) {
            case "number":
                if (l === undefined) {
                    l = 1
                }
                this._pools[c].update([b, this._eventId++, 1, l, j, 1, e | 0]);
                break;
            case "object":
                h = Object.prototype.toString.call(e);
                if (h === "[object Uint32Array]") {
                    g = [];
                    for (f = 0; f < e.length; f++) {
                        g.push(e[f])
                    }
                    e = g
                } else {
                    if (h !== "[object Array]") {
                        d = 1
                    }
                    for (f = 0; f < e.length && !d; f++) {
                        if (typeof(e[f]) !== "number") {
                            d = 1
                        }
                    }
                }
                if (!d) {
                    if (l === undefined) {
                        l = 0;
                        for (f = 0; f < e.length; f++) {
                            g = e[f];
                            while (g > 0) {
                                l++;
                                g = g >>> 1
                            }
                        }
                    }
                    this._pools[c].update([b, this._eventId++, 2, l, j, e.length].concat(e))
                }
                break;
            case "string":
                if (l === undefined) {
                    l = e.length
                }
                this._pools[c].update([b, this._eventId++, 3, l, j, e.length]);
                this._pools[c].update(e);
                break;
            default:
                d = 1
        }
        if (d) {
            throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string")
        }
        this._poolEntropy[c] += l;
        this._poolStrength += l;
        if (k === this._NOT_READY) {
            if (this.isReady() !== this._NOT_READY) {
                this._fireEvent("seeded", Math.max(this._strength, this._poolStrength))
            }
            this._fireEvent("progress", this.getProgress())
        }
    },
    isReady: function(b) {
        var a = this._PARANOIA_LEVELS[(b !== undefined) ? b : this._defaultParanoia];
        if (this._strength && this._strength >= a) {
            return (this._poolEntropy[0] > this._BITS_PER_RESEED && (new Date()).valueOf() > this._nextReseed) ? this._REQUIRES_RESEED | this._READY : this._READY
        } else {
            return (this._poolStrength >= a) ? this._REQUIRES_RESEED | this._NOT_READY : this._NOT_READY
        }
    },
    getProgress: function(b) {
        var a = this._PARANOIA_LEVELS[b ? b : this._defaultParanoia];
        if (this._strength >= a) {
            return 1
        } else {
            return (this._poolStrength > a) ? 1 : this._poolStrength / a
        }
    },
    startCollectors: function() {
        if (this._collectorsStarted) {
            return
        }
        this._eventListener = {
            loadTimeCollector: this._bind(this._loadTimeCollector),
            mouseCollector: this._bind(this._mouseCollector),
            keyboardCollector: this._bind(this._keyboardCollector),
            accelerometerCollector: this._bind(this._accelerometerCollector),
            touchCollector: this._bind(this._touchCollector)
        };
        if (window.addEventListener) {
            window.addEventListener("load", this._eventListener.loadTimeCollector, false);
            window.addEventListener("mousemove", this._eventListener.mouseCollector, false);
            window.addEventListener("keypress", this._eventListener.keyboardCollector, false);
            window.addEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
            window.addEventListener("touchmove", this._eventListener.touchCollector, false)
        } else {
            if (document.attachEvent) {
                document.attachEvent("onload", this._eventListener.loadTimeCollector);
                document.attachEvent("onmousemove", this._eventListener.mouseCollector);
                document.attachEvent("keypress", this._eventListener.keyboardCollector)
            } else {
                throw new sjcl.exception.bug("can't attach event")
            }
        }
        this._collectorsStarted = true
    },
    stopCollectors: function() {
        if (!this._collectorsStarted) {
            return
        }
        if (window.removeEventListener) {
            window.removeEventListener("load", this._eventListener.loadTimeCollector, false);
            window.removeEventListener("mousemove", this._eventListener.mouseCollector, false);
            window.removeEventListener("keypress", this._eventListener.keyboardCollector, false);
            window.removeEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
            window.removeEventListener("touchmove", this._eventListener.touchCollector, false)
        } else {
            if (document.detachEvent) {
                document.detachEvent("onload", this._eventListener.loadTimeCollector);
                document.detachEvent("onmousemove", this._eventListener.mouseCollector);
                document.detachEvent("keypress", this._eventListener.keyboardCollector)
            }
        }
        this._collectorsStarted = false
    },
    addEventListener: function(a, b) {
        this._callbacks[a][this._callbackI++] = b
    },
    removeEventListener: function(e, a) {
        var f, d, c = this._callbacks[e],
            b = [];
        for (d in c) {
            if (c.hasOwnProperty(d) && c[d] === a) {
                b.push(d)
            }
        }
        for (f = 0; f < b.length; f++) {
            d = b[f];
            delete c[d]
        }
    },
    _bind: function(b) {
        var a = this;
        return function() {
            b.apply(a, arguments)
        }
    },
    _gen4words: function() {
        for (var a = 0; a < 4; a++) {
            this._counter[a] = this._counter[a] + 1 | 0;
            if (this._counter[a]) {
                break
            }
        }
        return this._cipher.encrypt(this._counter)
    },
    _gate: function() {
        this._key = this._gen4words().concat(this._gen4words());
        this._cipher = new sjcl.cipher.aes(this._key)
    },
    _reseed: function(b) {
        this._key = sjcl.hash.sha256.hash(this._key.concat(b));
        this._cipher = new sjcl.cipher.aes(this._key);
        for (var a = 0; a < 4; a++) {
            this._counter[a] = this._counter[a] + 1 | 0;
            if (this._counter[a]) {
                break
            }
        }
    },
    _reseedFromPools: function(c) {
        var a = [],
            d = 0,
            b;
        this._nextReseed = a[0] = (new Date()).valueOf() + this._MILLISECONDS_PER_RESEED;
        for (b = 0; b < 16; b++) {
            a.push(Math.random() * 0x100000000 | 0)
        }
        for (b = 0; b < this._pools.length; b++) {
            a = a.concat(this._pools[b].finalize());
            d += this._poolEntropy[b];
            this._poolEntropy[b] = 0;
            if (!c && (this._reseedCount & (1 << b))) {
                break
            }
        }
        if (this._reseedCount >= 1 << this._pools.length) {
            this._pools.push(new sjcl.hash.sha256());
            this._poolEntropy.push(0)
        }
        this._poolStrength -= d;
        if (d > this._strength) {
            this._strength = d
        }
        this._reseedCount++;
        this._reseed(a)
    },
    _keyboardCollector: function() {
        this._addCurrentTimeToEntropy(1)
    },
    _mouseCollector: function(c) {
        var a, d;
        try {
            a = c.x || c.clientX || c.offsetX || 0;
            d = c.y || c.clientY || c.offsetY || 0
        } catch (b) {
            a = 0;
            d = 0
        }
        if (a != 0 && d != 0) {
            this.addEntropy([a, d], 2, "mouse")
        }
        this._addCurrentTimeToEntropy(0)
    },
    _touchCollector: function(b) {
        var d = b.touches[0] || b.changedTouches[0];
        var a = d.pageX || d.clientX,
            c = d.pageY || d.clientY;
        this.addEntropy([a, c], 1, "touch");
        this._addCurrentTimeToEntropy(0)
    },
    _loadTimeCollector: function() {
        this._addCurrentTimeToEntropy(2)
    },
    _addCurrentTimeToEntropy: function(a) {
        if (typeof window !== "undefined" && window.performance && typeof window.performance.now === "function") {
            this.addEntropy(window.performance.now(), a, "loadtime")
        } else {
            this.addEntropy((new Date()).valueOf(), a, "loadtime")
        }
    },
    _accelerometerCollector: function(b) {
        var a = b.accelerationIncludingGravity.x || b.accelerationIncludingGravity.y || b.accelerationIncludingGravity.z;
        if (window.orientation) {
            var c = window.orientation;
            if (typeof c === "number") {
                this.addEntropy(c, 1, "accelerometer")
            }
        }
        if (a) {
            this.addEntropy(a, 2, "accelerometer")
        }
        this._addCurrentTimeToEntropy(0)
    },
    _fireEvent: function(d, a) {
        var c, b = sjcl.random._callbacks[d],
            e = [];
        for (c in b) {
            if (b.hasOwnProperty(c)) {
                e.push(b[c])
            }
        }
        for (c = 0; c < e.length; c++) {
            e[c](a)
        }
    }
};
sjcl.random = new sjcl.prng(6);
(function() {
    function b() {
        try {
            return require("crypto")
        } catch (g) {
            return null
        }
    }
    try {
        var a, d, c;
        if (typeof module !== "undefined" && module.exports && (d = b()) && d.randomBytes) {
            a = d.randomBytes(1024 / 8);
            a = new Uint32Array(new Uint8Array(a).buffer);
            sjcl.random.addEntropy(a, 1024, "crypto.randomBytes")
        } else {
            if (typeof window !== "undefined" && typeof Uint32Array !== "undefined") {
                c = new Uint32Array(32);
                if (window.crypto && window.crypto.getRandomValues) {
                    window.crypto.getRandomValues(c)
                } else {
                    if (window.msCrypto && window.msCrypto.getRandomValues) {
                        window.msCrypto.getRandomValues(c)
                    } else {
                        return
                    }
                }
                sjcl.random.addEntropy(c, 1024, "crypto.getRandomValues")
            } else {
                a = require("random-js");
                d = a.engines.mt19937().autoSeed();
                c = new Uint32Array(32);
                for (var i = 0, len = c.length; i < len; i++) {
                    c[i] = a.integer(0, 4294967295)(d);
                }
                sjcl.random.addEntropy(c, 1024, "random-js.integer")
            }
        }
    } catch (f) {
        if (typeof window !== "undefined" && window.console) {
            console.log("There was an error collecting entropy from the browser:");
            console.log(f)
        }
    }
}());
sjcl.json = {
    defaults: {
        v: 1,
        iter: 10000,
        ks: 128,
        ts: 64,
        mode: "ccm",
        adata: "",
        cipher: "aes"
    },
    _encrypt: function(h, b, c, f) {
        c = c || {};
        f = f || {};
        var d = sjcl.json,
            a = d._add({
                iv: sjcl.random.randomWords(4, 0)
            }, d.defaults),
            e, g, i;
        d._add(a, c);
        i = a.adata;
        if (typeof a.salt === "string") {
            a.salt = sjcl.codec.base64.toBits(a.salt)
        }
        if (typeof a.iv === "string") {
            a.iv = sjcl.codec.base64.toBits(a.iv)
        }
        if (!sjcl.mode[a.mode] || !sjcl.cipher[a.cipher] || (typeof h === "string" && a.iter <= 100) || (a.ts !== 64 && a.ts !== 96 && a.ts !== 128) || (a.ks !== 128 && a.ks !== 192 && a.ks !== 0x100) || (a.iv.length < 2 || a.iv.length > 4)) {
            throw new sjcl.exception.invalid("json encrypt: invalid parameters")
        }
        if (typeof h === "string") {
            e = sjcl.misc.cachedPbkdf2(h, a);
            h = e.key.slice(0, a.ks / 32);
            a.salt = e.salt
        } else {
            if (sjcl.ecc && h instanceof sjcl.ecc.elGamal.publicKey) {
                e = h.kem();
                a.kemtag = e.tag;
                h = e.key.slice(0, a.ks / 32)
            }
        }
        if (typeof b === "string") {
            b = sjcl.codec.utf8String.toBits(b)
        }
        if (typeof i === "string") {
            a.adata = i = sjcl.codec.utf8String.toBits(i)
        }
        g = new sjcl.cipher[a.cipher](h);
        d._add(f, a);
        f.key = h;
        if (a.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && b instanceof ArrayBuffer) {
            a.ct = sjcl.arrayBuffer.ccm.encrypt(g, b, a.iv, i, a.ts)
        } else {
            a.ct = sjcl.mode[a.mode].encrypt(g, b, a.iv, i, a.ts)
        }
        return a
    },
    encrypt: function(b, d, f, c) {
        var a = sjcl.json,
            e = a._encrypt.apply(a, arguments);
        return a.encode(e)
    },
    _decrypt: function(i, b, c, f) {
        c = c || {};
        f = f || {};
        var d = sjcl.json,
            a = d._add(d._add(d._add({}, d.defaults), b), c, true),
            g, e, h, k = a.adata;
        if (typeof a.salt === "string") {
            a.salt = sjcl.codec.base64.toBits(a.salt)
        }
        if (typeof a.iv === "string") {
            a.iv = sjcl.codec.base64.toBits(a.iv)
        }
        if (!sjcl.mode[a.mode] || !sjcl.cipher[a.cipher] || (typeof i === "string" && a.iter <= 100) || (a.ts !== 64 && a.ts !== 96 && a.ts !== 128) || (a.ks !== 128 && a.ks !== 192 && a.ks !== 0x100) || (!a.iv) || (a.iv.length < 2 || a.iv.length > 4)) {
            throw new sjcl.exception.invalid("json decrypt: invalid parameters")
        }
        if (typeof i === "string") {
            e = sjcl.misc.cachedPbkdf2(i, a);
            i = e.key.slice(0, a.ks / 32);
            a.salt = e.salt
        } else {
            if (sjcl.ecc && i instanceof sjcl.ecc.elGamal.secretKey) {
                i = i.unkem(sjcl.codec.base64.toBits(a.kemtag)).slice(0, a.ks / 32)
            }
        }
        if (typeof k === "string") {
            k = sjcl.codec.utf8String.toBits(k)
        }
        h = new sjcl.cipher[a.cipher](i);
        if (a.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && a.ct instanceof ArrayBuffer) {
            g = sjcl.arrayBuffer.ccm.decrypt(h, a.ct, a.iv, a.tag, k, a.ts)
        } else {
            g = sjcl.mode[a.mode].decrypt(h, a.ct, a.iv, k, a.ts)
        }
        d._add(f, a);
        f.key = i;
        if (c.raw === 1) {
            return g
        } else {
            return sjcl.codec.utf8String.fromBits(g)
        }
    },
    decrypt: function(b, d, e, c) {
        var a = sjcl.json;
        return a._decrypt(b, a.decode(d), e, c)
    },
    encode: function(d) {
        var c, b = "{",
            a = "";
        for (c in d) {
            if (d.hasOwnProperty(c)) {
                if (!c.match(/^[a-z0-9]+$/i)) {
                    throw new sjcl.exception.invalid("json encode: invalid property name")
                }
                b += a + '"' + c + '":';
                a = ",";
                switch (typeof d[c]) {
                    case "number":
                    case "boolean":
                        b += d[c];
                        break;
                    case "string":
                        b += '"' + escape(d[c]) + '"';
                        break;
                    case "object":
                        b += '"' + sjcl.codec.base64.fromBits(d[c], 0) + '"';
                        break;
                    default:
                        throw new sjcl.exception.bug("json encode: unsupported type")
                }
            }
        }
        return b + "}"
    },
    decode: function(f) {
        f = f.replace(/\s/g, "");
        if (!f.match(/^\{.*\}$/)) {
            throw new sjcl.exception.invalid("json decode: this isn't json!")
        }
        var c = f.replace(/^\{|\}$/g, "").split(/,/),
            d = {},
            e, b;
        for (e = 0; e < c.length; e++) {
            if (!(b = c[e].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))) {
                throw new sjcl.exception.invalid("json decode: this isn't json!")
            }
            if (b[3] != null) {
                d[b[2]] = parseInt(b[3], 10)
            } else {
                if (b[4] != null) {
                    d[b[2]] = b[2].match(/^(ct|adata|salt|iv)$/) ? sjcl.codec.base64.toBits(b[4]) : unescape(b[4])
                } else {
                    if (b[5] != null) {
                        d[b[2]] = b[5] === "true"
                    }
                }
            }
        }
        return d
    },
    _add: function(c, d, b) {
        if (c === undefined) {
            c = {}
        }
        if (d === undefined) {
            return c
        }
        var a;
        for (a in d) {
            if (d.hasOwnProperty(a)) {
                if (b && c[a] !== undefined && c[a] !== d[a]) {
                    throw new sjcl.exception.invalid("required parameter overridden")
                }
                c[a] = d[a]
            }
        }
        return c
    },
    _subtract: function(d, c) {
        var a = {},
            b;
        for (b in d) {
            if (d.hasOwnProperty(b) && d[b] !== c[b]) {
                a[b] = d[b]
            }
        }
        return a
    },
    _filter: function(d, c) {
        var a = {},
            b;
        for (b = 0; b < c.length; b++) {
            if (d[c[b]] !== undefined) {
                a[c[b]] = d[c[b]]
            }
        }
        return a
    }
};
sjcl.encrypt = sjcl.json.encrypt;
sjcl.decrypt = sjcl.json.decrypt;
sjcl.misc._pbkdf2Cache = {};
sjcl.misc.cachedPbkdf2 = function(d, g) {
    var b = sjcl.misc._pbkdf2Cache,
        i, f, h, e, a;
    g = g || {};
    a = g.iter || 1000;
    f = b[d] = b[d] || {};
    i = f[a] = f[a] || {
        firstSalt: (g.salt && g.salt.length) ? g.salt.slice(0) : sjcl.random.randomWords(2, 0)
    };
    e = (g.salt === undefined) ? i.firstSalt : g.salt;
    i[e] = i[e] || sjcl.misc.pbkdf2(d, e, g.iter);
    return {
        key: i[e].slice(0),
        salt: e.slice(0)
    }
};
sjcl.bn = function(a) {
    this.initWith(a)
};
sjcl.bn.prototype = {
    radix: 24,
    maxMul: 8,
    _class: sjcl.bn,
    copy: function() {
        return new this._class(this)
    },
    initWith: function(c) {
        var b = 0,
            a;
        switch (typeof c) {
            case "object":
                this.limbs = c.limbs.slice(0);
                break;
            case "number":
                this.limbs = [c];
                this.normalize();
                break;
            case "string":
                c = c.replace(/^0x/, "");
                this.limbs = [];
                a = this.radix / 4;
                for (b = 0; b < c.length; b += a) {
                    this.limbs.push(parseInt(c.substring(Math.max(c.length - b - a, 0), c.length - b), 16))
                }
                break;
            default:
                this.limbs = [0]
        }
        return this
    },
    equals: function(b) {
        if (typeof b === "number") {
            b = new this._class(b)
        }
        var c = 0,
            a;
        this.fullReduce();
        b.fullReduce();
        for (a = 0; a < this.limbs.length || a < b.limbs.length; a++) {
            c |= this.getLimb(a) ^ b.getLimb(a)
        }
        return (c === 0)
    },
    getLimb: function(a) {
        return (a >= this.limbs.length) ? 0 : this.limbs[a]
    },
    greaterEquals: function(g) {
        if (typeof g === "number") {
            g = new this._class(g)
        }
        var e = 0,
            h = 0,
            f, d, c;
        f = Math.max(this.limbs.length, g.limbs.length) - 1;
        for (; f >= 0; f--) {
            d = this.getLimb(f);
            c = g.getLimb(f);
            h |= (c - d) & ~e;
            e |= (d - c) & ~h
        }
        return (h | ~e) >>> 31
    },
    toString: function() {
        this.fullReduce();
        var b = "",
            c, d, a = this.limbs;
        for (c = 0; c < this.limbs.length; c++) {
            d = a[c].toString(16);
            while (c < this.limbs.length - 1 && d.length < 6) {
                d = "0" + d
            }
            b = d + b
        }
        return "0x" + b
    },
    addM: function(c) {
        if (typeof(c) !== "object") {
            c = new this._class(c)
        }
        var b, a = this.limbs,
            d = c.limbs;
        for (b = a.length; b < d.length; b++) {
            a[b] = 0
        }
        for (b = 0; b < d.length; b++) {
            a[b] += d[b]
        }
        return this
    },
    doubleM: function() {
        var d, f = 0,
            c, e = this.radix,
            a = this.radixMask,
            b = this.limbs;
        for (d = 0; d < b.length; d++) {
            c = b[d];
            c = c + c + f;
            b[d] = c & a;
            f = c >> e
        }
        if (f) {
            b.push(f)
        }
        return this
    },
    halveM: function() {
        var c, e = 0,
            b, d = this.radix,
            a = this.limbs;
        for (c = a.length - 1; c >= 0; c--) {
            b = a[c];
            a[c] = (b + e) >> 1;
            e = (b & 1) << d
        }
        if (!a[a.length - 1]) {
            a.pop()
        }
        return this
    },
    subM: function(c) {
        if (typeof(c) !== "object") {
            c = new this._class(c)
        }
        var b, a = this.limbs,
            d = c.limbs;
        for (b = a.length; b < d.length; b++) {
            a[b] = 0
        }
        for (b = 0; b < d.length; b++) {
            a[b] -= d[b]
        }
        return this
    },
    mod: function(c) {
        var d = !this.greaterEquals(new sjcl.bn(0));
        c = new sjcl.bn(c).normalize();
        var a = new sjcl.bn(this).normalize(),
            b = 0;
        if (d) {
            a = (new sjcl.bn(0)).subM(a).normalize()
        }
        for (; a.greaterEquals(c); b++) {
            c.doubleM()
        }
        if (d) {
            a = c.sub(a).normalize()
        }
        for (; b > 0; b--) {
            c.halveM();
            if (a.greaterEquals(c)) {
                a.subM(c).normalize()
            }
        }
        return a.trim()
    },
    inverseMod: function(h) {
        var e = new sjcl.bn(1),
            d = new sjcl.bn(0),
            c = new sjcl.bn(this),
            k = new sjcl.bn(h),
            g, f, j = 1;
        if (!(h.limbs[0] & 1)) {
            throw (new sjcl.exception.invalid("inverseMod: p must be odd"))
        }
        do {
            if (c.limbs[0] & 1) {
                if (!c.greaterEquals(k)) {
                    g = c;
                    c = k;
                    k = g;
                    g = e;
                    e = d;
                    d = g
                }
                c.subM(k);
                c.normalize();
                if (!e.greaterEquals(d)) {
                    e.addM(h)
                }
                e.subM(d)
            }
            c.halveM();
            if (e.limbs[0] & 1) {
                e.addM(h)
            }
            e.normalize();
            e.halveM();
            for (f = j = 0; f < c.limbs.length; f++) {
                j |= c.limbs[f]
            }
        } while (j);
        if (!k.equals(1)) {
            throw (new sjcl.exception.invalid("inverseMod: p and x must be relatively prime"))
        }
        return d
    },
    add: function(a) {
        return this.copy().addM(a)
    },
    sub: function(a) {
        return this.copy().subM(a)
    },
    mul: function(k) {
        if (typeof(k) === "number") {
            k = new this._class(k)
        }
        var g, e, o = this.limbs,
            n = k.limbs,
            h = o.length,
            d = n.length,
            f = new this._class(),
            m = f.limbs,
            l, p = this.maxMul;
        for (g = 0; g < this.limbs.length + k.limbs.length + 1; g++) {
            m[g] = 0
        }
        for (g = 0; g < h; g++) {
            l = o[g];
            for (e = 0; e < d; e++) {
                m[g + e] += l * n[e]
            }
            if (!--p) {
                p = this.maxMul;
                f.cnormalize()
            }
        }
        return f.cnormalize().reduce()
    },
    square: function() {
        return this.mul(this)
    },
    power: function(a) {
        a = new sjcl.bn(a).normalize().trim().limbs;
        var d, c, b = new this._class(1),
            e = this;
        for (d = 0; d < a.length; d++) {
            for (c = 0; c < this.radix; c++) {
                if (a[d] & (1 << c)) {
                    b = b.mul(e)
                }
                if (d == (a.length - 1) && a[d] >> (c + 1) == 0) {
                    break
                }
                e = e.square()
            }
        }
        return b
    },
    mulmod: function(a, b) {
        return this.mod(b).mul(a.mod(b)).mod(b)
    },
    powermod: function(a, h) {
        a = new sjcl.bn(a);
        h = new sjcl.bn(h);
        if ((h.limbs[0] & 1) == 1) {
            var f = this.montpowermod(a, h);
            if (f != false) {
                return f
            }
        }
        var e, d, b = a.normalize().trim().limbs,
            c = new this._class(1),
            g = this;
        for (e = 0; e < b.length; e++) {
            for (d = 0; d < this.radix; d++) {
                if (b[e] & (1 << d)) {
                    c = c.mulmod(g, h)
                }
                if (e == (b.length - 1) && b[e] >> (d + 1) == 0) {
                    break
                }
                g = g.mulmod(g, h)
            }
        }
        return c
    },
    montpowermod: function(p, m) {
        p = new sjcl.bn(p).normalize().trim();
        m = new sjcl.bn(m);
        var v, u, k = this.radix,
            w = new this._class(1),
            e = this.copy();
        var f, q, b, t = p.bitLength();
        f = new sjcl.bn({
            limbs: m.copy().normalize().trim().limbs.map(function() {
                return 0
            })
        });
        for (q = this.radix; q > 0; q--) {
            if (((m.limbs[m.limbs.length - 1] >> q) & 1) == 1) {
                f.limbs[f.limbs.length - 1] = 1 << q;
                break
            }
        }
        if (t == 0) {
            return this
        } else {
            if (t < 18) {
                b = 1
            } else {
                if (t < 48) {
                    b = 3
                } else {
                    if (t < 144) {
                        b = 4
                    } else {
                        if (t < 768) {
                            b = 5
                        } else {
                            b = 6
                        }
                    }
                }
            }
        }
        var c = f.copy(),
            B = m.copy(),
            d = new sjcl.bn(1),
            z = new sjcl.bn(0),
            a = f.copy();
        while (a.greaterEquals(1)) {
            a.halveM();
            if ((d.limbs[0] & 1) == 0) {
                d.halveM();
                z.halveM()
            } else {
                d.addM(B);
                d.halveM();
                z.halveM();
                z.addM(c)
            }
        }
        d = d.normalize();
        z = z.normalize();
        c.doubleM();
        var A = c.mulmod(c, m);
        if (!c.mul(d).sub(m.mul(z)).equals(1)) {
            return false
        }
        var C = function(h) {
                return n(h, A)
            },
            n = function(j, h) {
                var l, H, G, x, s, i = (1 << (q + 1)) - 1;
                G = j.mul(h);
                x = G.mul(z);
                x.limbs = x.limbs.slice(0, f.limbs.length);
                if (x.limbs.length == f.limbs.length) {
                    x.limbs[f.limbs.length - 1] &= i
                }
                x = x.mul(m);
                s = G.add(x).normalize().trim();
                s.limbs = s.limbs.slice(f.limbs.length - 1);
                for (l = 0; l < s.limbs.length; l++) {
                    if (l > 0) {
                        s.limbs[l - 1] |= (s.limbs[l] & i) << (k - q - 1)
                    }
                    s.limbs[l] = s.limbs[l] >> (q + 1)
                }
                if (s.greaterEquals(m)) {
                    s.subM(m)
                }
                return s
            },
            g = function(h) {
                return n(h, 1)
            };
        e = C(e);
        w = C(w);
        var y, F = {},
            o = (1 << (b - 1)) - 1;
        F[1] = e.copy();
        F[2] = n(e, e);
        for (y = 1; y <= o; y++) {
            F[(2 * y) + 1] = n(F[(2 * y) - 1], F[2])
        }
        var E = function(l, h) {
            var j = h % l.radix;
            return (l.limbs[Math.floor(h / l.radix)] & (1 << j)) >> j
        };
        for (v = p.bitLength() - 1; v >= 0;) {
            if (E(p, v) == 0) {
                w = n(w, w);
                v = v - 1
            } else {
                var r = v - b + 1;
                while (E(p, r) == 0) {
                    r++
                }
                var D = 0;
                for (u = r; u <= v; u++) {
                    D += E(p, u) << (u - r);
                    w = n(w, w)
                }
                w = n(w, F[D]);
                v = r - 1
            }
        }
        return g(w)
    },
    trim: function() {
        var a = this.limbs,
            b;
        do {
            b = a.pop()
        } while (a.length && b === 0);
        a.push(b);
        return this
    },
    reduce: function() {
        return this
    },
    fullReduce: function() {
        return this.normalize()
    },
    normalize: function() {
        var h = 0,
            c, g = this.placeVal,
            e = this.ipv,
            b, a, f = this.limbs,
            d = f.length,
            j = this.radixMask;
        for (c = 0; c < d || (h !== 0 && h !== -1); c++) {
            b = (f[c] || 0) + h;
            a = f[c] = b & j;
            h = (b - a) * e
        }
        if (h === -1) {
            f[c - 1] -= g
        }
        this.trim();
        return this
    },
    cnormalize: function() {
        var g = 0,
            e, d = this.ipv,
            c, a, h = this.limbs,
            f = h.length,
            b = this.radixMask;
        for (e = 0; e < f - 1; e++) {
            c = h[e] + g;
            a = h[e] = c & b;
            g = (c - a) * d
        }
        h[e] += g;
        return this
    },
    toBits: function(a) {
        this.fullReduce();
        a = a || this.exponent || this.bitLength();
        var d = Math.floor((a - 1) / 24),
            b = sjcl.bitArray,
            f = (a + 7 & -8) % this.radix || this.radix,
            c = [b.partial(f, this.getLimb(d))];
        for (d--; d >= 0; d--) {
            c = b.concat(c, [b.partial(Math.min(this.radix, a), this.getLimb(d))]);
            a -= this.radix
        }
        return c
    },
    bitLength: function() {
        this.fullReduce();
        var c = this.radix * (this.limbs.length - 1),
            a = this.limbs[this.limbs.length - 1];
        for (; a; a >>>= 1) {
            c++
        }
        return c + 7 & -8
    }
};
sjcl.bn.fromBits = function(g) {
    var c = this,
        d = new c(),
        i = [],
        b = sjcl.bitArray,
        f = this.prototype,
        a = Math.min(this.bitLength || 0x100000000, b.bitLength(g)),
        h = a % f.radix || f.radix;
    i[0] = b.extract(g, 0, h);
    for (; h < a; h += f.radix) {
        i.unshift(b.extract(g, h, f.radix))
    }
    d.limbs = i;
    return d
};
sjcl.bn.prototype.ipv = 1 / (sjcl.bn.prototype.placeVal = Math.pow(2, sjcl.bn.prototype.radix));
sjcl.bn.prototype.radixMask = (1 << sjcl.bn.prototype.radix) - 1;
sjcl.bn.pseudoMersennePrime = function(f, b) {
    function g(h) {
        this.initWith(h)
    }
    var a = g.prototype = new sjcl.bn(),
        d, c, e;
    e = a.modOffset = Math.ceil(c = f / a.radix);
    a.exponent = f;
    a.offset = [];
    a.factor = [];
    a.minOffset = e;
    a.fullMask = 0;
    a.fullOffset = [];
    a.fullFactor = [];
    a.modulus = g.modulus = new sjcl.bn(Math.pow(2, f));
    a.fullMask = 0 | -Math.pow(2, f % a.radix);
    for (d = 0; d < b.length; d++) {
        a.offset[d] = Math.floor(b[d][0] / a.radix - c);
        a.fullOffset[d] = Math.ceil(b[d][0] / a.radix - c);
        a.factor[d] = b[d][1] * Math.pow(1 / 2, f - b[d][0] + a.offset[d] * a.radix);
        a.fullFactor[d] = b[d][1] * Math.pow(1 / 2, f - b[d][0] + a.fullOffset[d] * a.radix);
        a.modulus.addM(new sjcl.bn(Math.pow(2, b[d][0]) * b[d][1]));
        a.minOffset = Math.min(a.minOffset, -a.offset[d])
    }
    a._class = g;
    a.modulus.cnormalize();
    a.reduce = function() {
        var p, o, n, m = this.modOffset,
            s = this.limbs,
            j = this.offset,
            q = this.offset.length,
            h = this.factor,
            r;
        p = this.minOffset;
        while (s.length > m) {
            n = s.pop();
            r = s.length;
            for (o = 0; o < q; o++) {
                s[r + j[o]] -= h[o] * n
            }
            p--;
            if (!p) {
                s.push(0);
                this.cnormalize();
                p = this.minOffset
            }
        }
        this.cnormalize();
        return this
    };
    a._strongReduce = (a.fullMask === -1) ? a.reduce : function() {
        var n = this.limbs,
            m = n.length - 1,
            j, h;
        this.reduce();
        if (m === this.modOffset - 1) {
            h = n[m] & this.fullMask;
            n[m] -= h;
            for (j = 0; j < this.fullOffset.length; j++) {
                n[m + this.fullOffset[j]] -= this.fullFactor[j] * h
            }
            this.normalize()
        }
    };
    a.fullReduce = function() {
        var j, h;
        this._strongReduce();
        this.addM(this.modulus);
        this.addM(this.modulus);
        this.normalize();
        this._strongReduce();
        for (h = this.limbs.length; h < this.modOffset; h++) {
            this.limbs[h] = 0
        }
        j = this.greaterEquals(this.modulus);
        for (h = 0; h < this.limbs.length; h++) {
            this.limbs[h] -= this.modulus.limbs[h] * j
        }
        this.cnormalize();
        return this
    };
    a.inverse = function() {
        return (this.power(this.modulus.sub(2)))
    };
    g.fromBits = sjcl.bn.fromBits;
    return g
};
var sbp = sjcl.bn.pseudoMersennePrime;
sjcl.bn.prime = {
    p127: sbp(127, [
        [0, -1]
    ]),
    p25519: sbp(255, [
        [0, -19]
    ]),
    p192k: sbp(192, [
        [32, -1],
        [12, -1],
        [8, -1],
        [7, -1],
        [6, -1],
        [3, -1],
        [0, -1]
    ]),
    p224k: sbp(224, [
        [32, -1],
        [12, -1],
        [11, -1],
        [9, -1],
        [7, -1],
        [4, -1],
        [1, -1],
        [0, -1]
    ]),
    p256k: sbp(0x100, [
        [32, -1],
        [9, -1],
        [8, -1],
        [7, -1],
        [6, -1],
        [4, -1],
        [0, -1]
    ]),
    p192: sbp(192, [
        [0, -1],
        [64, -1]
    ]),
    p224: sbp(224, [
        [0, 1],
        [96, -1]
    ]),
    p256: sbp(0x100, [
        [0, -1],
        [96, 1],
        [192, 1],
        [224, -1]
    ]),
    p384: sbp(384, [
        [0, -1],
        [32, 1],
        [96, -1],
        [128, -1]
    ]),
    p521: sbp(521, [
        [0, -1]
    ])
};
sjcl.bn.random = function(c, f) {
    if (typeof c !== "object") {
        c = new sjcl.bn(c)
    }
    var g, e, b = c.limbs.length,
        a = c.limbs[b - 1] + 1,
        d = new sjcl.bn();
    while (true) {
        do {
            g = sjcl.random.randomWords(b, f);
            if (g[b - 1] < 0) {
                g[b - 1] += 0x100000000
            }
        } while (Math.floor(g[b - 1] / a) === Math.floor(0x100000000 / a));
        g[b - 1] %= a;
        for (e = 0; e < b - 1; e++) {
            g[e] &= c.radixMask
        }
        d.limbs = g;
        if (!d.greaterEquals(c)) {
            return d
        }
    }
};
sjcl.ecc = {};
sjcl.ecc.point = function(b, a, c) {
    if (a === undefined) {
        this.isIdentity = true
    } else {
        if (a instanceof sjcl.bn) {
            a = new b.field(a)
        }
        if (c instanceof sjcl.bn) {
            c = new b.field(c)
        }
        this.x = a;
        this.y = c;
        this.isIdentity = false
    }
    this.curve = b
};
sjcl.ecc.point.prototype = {
    toJac: function() {
        return new sjcl.ecc.pointJac(this.curve, this.x, this.y, new this.curve.field(1))
    },
    mult: function(a) {
        return this.toJac().mult(a, this).toAffine()
    },
    mult2: function(a, c, b) {
        return this.toJac().mult2(a, this, c, b).toAffine()
    },
    multiples: function() {
        var a, c, b;
        if (this._multiples === undefined) {
            b = this.toJac().doubl();
            a = this._multiples = [new sjcl.ecc.point(this.curve), this, b.toAffine()];
            for (c = 3; c < 16; c++) {
                b = b.add(this);
                a.push(b.toAffine())
            }
        }
        return this._multiples
    },
    negate: function() {
        var a = new this.curve.field(0).sub(this.y).normalize().reduce();
        return new sjcl.ecc.point(this.curve, this.x, a)
    },
    isValid: function() {
        return this.y.square().equals(this.curve.b.add(this.x.mul(this.curve.a.add(this.x.square()))))
    },
    toBits: function() {
        return sjcl.bitArray.concat(this.x.toBits(), this.y.toBits())
    }
};
sjcl.ecc.pointJac = function(c, a, d, b) {
    if (a === undefined) {
        this.isIdentity = true
    } else {
        this.x = a;
        this.y = d;
        this.z = b;
        this.isIdentity = false
    }
    this.curve = c
};
sjcl.ecc.pointJac.prototype = {
    add: function(e) {
        var g = this,
            f, k, i, h, b, a, o, n, m, l, j;
        if (g.curve !== e.curve) {
            throw new sjcl.exception.invalid("sjcl.ecc.add(): Points must be on the same curve to add them!")
        }
        if (g.isIdentity) {
            return e.toJac()
        } else {
            if (e.isIdentity) {
                return g
            }
        }
        f = g.z.square();
        k = e.x.mul(f).subM(g.x);
        if (k.equals(0)) {
            if (g.y.equals(e.y.mul(f.mul(g.z)))) {
                return g.doubl()
            } else {
                return new sjcl.ecc.pointJac(g.curve)
            }
        }
        i = e.y.mul(f.mul(g.z)).subM(g.y);
        h = k.square();
        b = i.square();
        a = k.square().mul(k).addM(g.x.add(g.x).mul(h));
        o = b.subM(a);
        n = g.x.mul(h).subM(o).mul(i);
        m = g.y.mul(k.square().mul(k));
        l = n.subM(m);
        j = g.z.mul(k);
        return new sjcl.ecc.pointJac(this.curve, o, l, j)
    },
    doubl: function() {
        if (this.isIdentity) {
            return this
        }
        var g = this.y.square(),
            f = g.mul(this.x.mul(4)),
            e = g.square().mul(8),
            h = this.z.square(),
            k = this.curve.a.toString() == (new sjcl.bn(-3)).toString() ? this.x.sub(h).mul(3).mul(this.x.add(h)) : this.x.square().mul(3).add(h.square().mul(this.curve.a)),
            d = k.square().subM(f).subM(f),
            j = f.sub(d).mul(k).subM(e),
            i = this.y.add(this.y).mul(this.z);
        return new sjcl.ecc.pointJac(this.curve, d, j, i)
    },
    toAffine: function() {
        if (this.isIdentity || this.z.equals(0)) {
            return new sjcl.ecc.point(this.curve)
        }
        var b = this.z.inverse(),
            a = b.square();
        return new sjcl.ecc.point(this.curve, this.x.mul(a).fullReduce(), this.y.mul(a.mul(b)).fullReduce())
    },
    mult: function(a, e) {
        if (typeof(a) === "number") {
            a = [a]
        } else {
            if (a.limbs !== undefined) {
                a = a.normalize().limbs
            }
        }
        var d, c, b = new sjcl.ecc.point(this.curve).toJac(),
            f = e.multiples();
        for (d = a.length - 1; d >= 0; d--) {
            for (c = sjcl.bn.prototype.radix - 4; c >= 0; c -= 4) {
                b = b.doubl().doubl().doubl().doubl().add(f[a[d] >> c & 15])
            }
        }
        return b
    },
    mult2: function(k, g, h, b) {
        if (typeof(k) === "number") {
            k = [k]
        } else {
            if (k.limbs !== undefined) {
                k = k.normalize().limbs
            }
        }
        if (typeof(h) === "number") {
            h = [h]
        } else {
            if (h.limbs !== undefined) {
                h = h.normalize().limbs
            }
        }
        var f, d, e = new sjcl.ecc.point(this.curve).toJac(),
            m = g.multiples(),
            l = b.multiples(),
            c, a;
        for (f = Math.max(k.length, h.length) - 1; f >= 0; f--) {
            c = k[f] | 0;
            a = h[f] | 0;
            for (d = sjcl.bn.prototype.radix - 4; d >= 0; d -= 4) {
                e = e.doubl().doubl().doubl().doubl().add(m[c >> d & 15]).add(l[a >> d & 15])
            }
        }
        return e
    },
    negate: function() {
        return this.toAffine().negate().toJac()
    },
    isValid: function() {
        var c = this.z.square(),
            b = c.square(),
            a = b.mul(c);
        return this.y.square().equals(this.curve.b.mul(a).add(this.x.mul(this.curve.a.mul(b).add(this.x.square()))))
    }
};
sjcl.ecc.curve = function(f, g, e, d, c, h) {
    this.field = f;
    this.r = new sjcl.bn(g);
    this.a = new f(e);
    this.b = new f(d);
    this.G = new sjcl.ecc.point(this, new f(c), new f(h))
};
sjcl.ecc.curve.prototype.fromBits = function(c) {
    var b = sjcl.bitArray,
        a = this.field.prototype.exponent + 7 & -8,
        d = new sjcl.ecc.point(this, this.field.fromBits(b.bitSlice(c, 0, a)), this.field.fromBits(b.bitSlice(c, a, 2 * a)));
    if (!d.isValid()) {
        throw new sjcl.exception.corrupt("not on the curve!")
    }
    return d
};
sjcl.ecc.curves = {
    c192: new sjcl.ecc.curve(sjcl.bn.prime.p192, "0xffffffffffffffffffffffff99def836146bc9b1b4d22831", -3, "0x64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1", "0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012", "0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811"),
    c224: new sjcl.ecc.curve(sjcl.bn.prime.p224, "0xffffffffffffffffffffffffffff16a2e0b8f03e13dd29455c5c2a3d", -3, "0xb4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4", "0xb70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21", "0xbd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34"),
    c256: new sjcl.ecc.curve(sjcl.bn.prime.p256, "0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551", -3, "0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b", "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296", "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"),
    c384: new sjcl.ecc.curve(sjcl.bn.prime.p384, "0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973", -3, "0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef", "0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7", "0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"),
    c521: new sjcl.ecc.curve(sjcl.bn.prime.p521, "0x1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409", -3, "0x051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00", "0xC6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66", "0x11839296A789A3BC0045C8A5FB42C7D1BD998F54449579B446817AFBD17273E662C97EE72995EF42640C550B9013FAD0761353C7086A272C24088BE94769FD16650"),
    k192: new sjcl.ecc.curve(sjcl.bn.prime.p192k, "0xfffffffffffffffffffffffe26f2fc170f69466a74defd8d", 0, 3, "0xdb4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d", "0x9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d"),
    k224: new sjcl.ecc.curve(sjcl.bn.prime.p224k, "0x010000000000000000000000000001dce8d2ec6184caf0a971769fb1f7", 0, 5, "0xa1455b334df099df30fc28a169a467e9e47075a90f7e650eb6b7a45c", "0x7e089fed7fba344282cafbd6f7e319f7c0b0bd59e2ca4bdb556d61a5"),
    k256: new sjcl.ecc.curve(sjcl.bn.prime.p256k, "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 0, 7, "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798", "0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
sjcl.ecc.curveName = function(b) {
    var a;
    for (a in sjcl.ecc.curves) {
        if (sjcl.ecc.curves.hasOwnProperty(a)) {
            if (sjcl.ecc.curves[a] === b) {
                return a
            }
        }
    }
    throw new sjcl.exception.invalid("no such curve")
};
sjcl.ecc.deserialize = function(c) {
    var b = ["elGamal", "ecdsa"];
    if (!c || !c.curve || !sjcl.ecc.curves[c.curve]) {
        throw new sjcl.exception.invalid("invalid serialization")
    }
    if (b.indexOf(c.type) === -1) {
        throw new sjcl.exception.invalid("invalid type")
    }
    var e = sjcl.ecc.curves[c.curve];
    if (c.secretKey) {
        if (!c.exponent) {
            throw new sjcl.exception.invalid("invalid exponent")
        }
        var d = new sjcl.bn(c.exponent);
        return new sjcl.ecc[c.type].secretKey(e, d)
    } else {
        if (!c.point) {
            throw new sjcl.exception.invalid("invalid point")
        }
        var a = e.fromBits(sjcl.codec.hex.toBits(c.point));
        return new sjcl.ecc[c.type].publicKey(e, a)
    }
};
sjcl.ecc.basicKey = {
    publicKey: function(b, a) {
        this._curve = b;
        this._curveBitLength = b.r.bitLength();
        if (a instanceof Array) {
            this._point = b.fromBits(a)
        } else {
            this._point = a
        }
        this.serialize = function() {
            var c = sjcl.ecc.curveName(b);
            return {
                type: this.getType(),
                secretKey: false,
                point: sjcl.codec.hex.fromBits(this._point.toBits()),
                curve: c
            }
        };
        this.get = function() {
            var e = this._point.toBits();
            var d = sjcl.bitArray.bitLength(e);
            var c = sjcl.bitArray.bitSlice(e, 0, d / 2);
            var f = sjcl.bitArray.bitSlice(e, d / 2);
            return {
                x: c,
                y: f
            }
        }
    },
    secretKey: function(b, a) {
        this._curve = b;
        this._curveBitLength = b.r.bitLength();
        this._exponent = a;
        this.serialize = function() {
            var c = this.get();
            var d = sjcl.ecc.curveName(b);
            return {
                type: this.getType(),
                secretKey: true,
                exponent: sjcl.codec.hex.fromBits(c),
                curve: d
            }
        };
        this.get = function() {
            return this._exponent.toBits()
        }
    }
};
sjcl.ecc.basicKey.generateKeys = function(b) {
    return function a(f, e, c) {
        f = f || 0x100;
        if (typeof f === "number") {
            f = sjcl.ecc.curves["c" + f];
            if (f === undefined) {
                throw new sjcl.exception.invalid("no such curve")
            }
        }
        c = c || sjcl.bn.random(f.r, e);
        var d = f.G.mult(c);
        return {
            pub: new sjcl.ecc[b].publicKey(f, d),
            sec: new sjcl.ecc[b].secretKey(f, c)
        }
    }
};
sjcl.ecc.elGamal = {
    generateKeys: sjcl.ecc.basicKey.generateKeys("elGamal"),
    publicKey: function(b, a) {
        sjcl.ecc.basicKey.publicKey.apply(this, arguments)
    },
    secretKey: function(b, a) {
        sjcl.ecc.basicKey.secretKey.apply(this, arguments)
    }
};
sjcl.ecc.elGamal.publicKey.prototype = {
    kem: function(d) {
        var c = sjcl.bn.random(this._curve.r, d),
            a = this._curve.G.mult(c).toBits(),
            b = sjcl.hash.sha256.hash(this._point.mult(c).toBits());
        return {
            key: b,
            tag: a
        }
    },
    getType: function() {
        return "elGamal"
    }
};
sjcl.ecc.elGamal.secretKey.prototype = {
    unkem: function(a) {
        return sjcl.hash.sha256.hash(this._curve.fromBits(a).mult(this._exponent).toBits())
    },
    dh: function(a) {
        return sjcl.hash.sha256.hash(a._point.mult(this._exponent).toBits())
    },
    dhJavaEc: function(a) {
        return a._point.mult(this._exponent).x.toBits()
    },
    getType: function() {
        return "elGamal"
    }
};
sjcl.ecc.ecdsa = {
    generateKeys: sjcl.ecc.basicKey.generateKeys("ecdsa")
};
sjcl.ecc.ecdsa.publicKey = function(b, a) {
    sjcl.ecc.basicKey.publicKey.apply(this, arguments)
};
sjcl.ecc.ecdsa.publicKey.prototype = {
    verify: function(f, e, b) {
        if (sjcl.bitArray.bitLength(f) > this._curveBitLength) {
            f = sjcl.bitArray.clamp(f, this._curveBitLength)
        }
        var i = sjcl.bitArray,
            g = this._curve.r,
            d = this._curveBitLength,
            a = sjcl.bn.fromBits(i.bitSlice(e, 0, d)),
            m = sjcl.bn.fromBits(i.bitSlice(e, d, 2 * d)),
            k = b ? m : m.inverseMod(g),
            h = sjcl.bn.fromBits(f).mul(k).mod(g),
            j = a.mul(k).mod(g),
            c = this._curve.G.mult2(h, j, this._point).x;
        if (a.equals(0) || m.equals(0) || a.greaterEquals(g) || m.greaterEquals(g) || !c.equals(a)) {
            if (b === undefined) {
                return this.verify(f, e, true)
            } else {
                throw (new sjcl.exception.corrupt("signature didn't check out"))
            }
        }
        return true
    },
    getType: function() {
        return "ecdsa"
    }
};
sjcl.ecc.ecdsa.secretKey = function(b, a) {
    sjcl.ecc.basicKey.secretKey.apply(this, arguments)
};
sjcl.ecc.ecdsa.secretKey.prototype = {
    sign: function(f, h, b, c) {
        if (sjcl.bitArray.bitLength(f) > this._curveBitLength) {
            f = sjcl.bitArray.clamp(f, this._curveBitLength)
        }
        var g = this._curve.r,
            d = g.bitLength(),
            e = c || sjcl.bn.random(g.sub(1), h).add(1),
            a = this._curve.G.mult(e).x.mod(g),
            j = sjcl.bn.fromBits(f).add(a.mul(this._exponent)),
            i = b ? j.inverseMod(g).mul(e).mod(g) : j.mul(e.inverseMod(g)).mod(g);
        return sjcl.bitArray.concat(a.toBits(d), i.toBits(d))
    },
    getType: function() {
        return "ecdsa"
    }
};
sjcl.keyexchange.srp = {
    makeVerifier: function(b, d, c, e) {
        var a;
        a = sjcl.keyexchange.srp.makeX(b, d, c);
        a = sjcl.bn.fromBits(a);
        return e.g.powermod(a, e.N)
    },
    makeX: function(b, d, c) {
        var a = sjcl.hash.sha1.hash(b + ":" + d);
        return sjcl.hash.sha1.hash(sjcl.bitArray.concat(c, a))
    },
    knownGroup: function(a) {
        if (typeof a !== "string") {
            a = a.toString()
        }
        if (!sjcl.keyexchange.srp._didInitKnownGroups) {
            sjcl.keyexchange.srp._initKnownGroups()
        }
        return sjcl.keyexchange.srp._knownGroups[a]
    },
    _didInitKnownGroups: false,
    _initKnownGroups: function() {
        var b, a, c;
        for (b = 0; b < sjcl.keyexchange.srp._knownGroupSizes.length; b++) {
            a = sjcl.keyexchange.srp._knownGroupSizes[b].toString();
            c = sjcl.keyexchange.srp._knownGroups[a];
            c.N = new sjcl.bn(c.N);
            c.g = new sjcl.bn(c.g)
        }
        sjcl.keyexchange.srp._didInitKnownGroups = true
    },
    _knownGroupSizes: [1024, 1536, 2048, 3072, 0x1000, 6144, 8192],
    _knownGroups: {
        1024: {
            N: "EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3",
            g: 2
        },
        1536: {
            N: "9DEF3CAFB939277AB1F12A8617A47BBBDBA51DF499AC4C80BEEEA9614B19CC4D5F4F5F556E27CBDE51C6A94BE4607A291558903BA0D0F84380B655BB9A22E8DCDF028A7CEC67F0D08134B1C8B97989149B609E0BE3BAB63D47548381DBC5B1FC764E3F4B53DD9DA1158BFD3E2B9C8CF56EDF019539349627DB2FD53D24B7C48665772E437D6C7F8CE442734AF7CCB7AE837C264AE3A9BEB87F8A2FE9B8B5292E5A021FFF5E91479E8CE7A28C2442C6F315180F93499A234DCF76E3FED135F9BB",
            g: 2
        },
        2048: {
            N: "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73",
            g: 2
        },
        3072: {
            N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF",
            g: 5
        },
        0x1000: {
            N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF",
            g: 5
        },
        6144: {
            N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DCC4024FFFFFFFFFFFFFFFF",
            g: 5
        },
        8192: {
            N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFFF",
            g: 19
        }
    }
};
sjcl.arrayBuffer = sjcl.arrayBuffer || {};
if (typeof(ArrayBuffer) === "undefined") {
    (function(a) {
        a.ArrayBuffer = function() {};
        a.DataView = function() {}
    }(this))
}
sjcl.arrayBuffer.ccm = {
    mode: "ccm",
    defaults: {
        tlen: 128
    },
    compat_encrypt: function(b, a, e, i, d) {
        var c = sjcl.codec.arrayBuffer.fromBits(a, true, 16),
            g = sjcl.bitArray.bitLength(a) / 8,
            j, f, h;
        d = d || 64;
        i = i || [];
        j = sjcl.arrayBuffer.ccm.encrypt(b, c, e, i, d, g);
        f = sjcl.codec.arrayBuffer.toBits(j.ciphertext_buffer);
        f = sjcl.bitArray.clamp(f, g * 8);
        return sjcl.bitArray.concat(f, j.tag)
    },
    compat_decrypt: function(b, c, e, o, d) {
        d = d || 64;
        o = o || [];
        var j, g, l = sjcl.bitArray,
            h = l.bitLength(c),
            f = l.clamp(c, h - d),
            n = l.bitSlice(c, h - d),
            k, m = sjcl.codec.arrayBuffer.fromBits(f, true, 16);
        var a = sjcl.arrayBuffer.ccm.decrypt(b, m, e, n, o, d, (h - d) / 8);
        return sjcl.bitArray.clamp(sjcl.codec.arrayBuffer.toBits(a), h - d)
    },
    encrypt: function(b, c, e, k, d, h) {
        var i, f, g, j = sjcl.bitArray,
            a = j.bitLength(e) / 8;
        k = k || [];
        d = d || sjcl.arrayBuffer.ccm.defaults.tlen;
        h = h || c.byteLength;
        d = Math.ceil(d / 8);
        for (g = 2; g < 4 && h >>> 8 * g; g++) {}
        if (g < 15 - a) {
            g = 15 - a
        }
        e = j.clamp(e, 8 * (15 - g));
        f = sjcl.arrayBuffer.ccm._computeTag(b, c, e, k, d, h, g);
        f = sjcl.arrayBuffer.ccm._ctrMode(b, c, e, f, d, g);
        return {
            ciphertext_buffer: c,
            tag: f
        }
    },
    decrypt: function(c, m, e, n, l, d, j) {
        var g, a, f, h, k = sjcl.bitArray,
            b = k.bitLength(e) / 8;
        l = l || [];
        d = d || sjcl.arrayBuffer.ccm.defaults.tlen;
        j = j || m.byteLength;
        d = Math.ceil(d / 8);
        for (h = 2; h < 4 && j >>> 8 * h; h++) {}
        if (h < 15 - b) {
            h = 15 - b
        }
        e = k.clamp(e, 8 * (15 - h));
        g = sjcl.arrayBuffer.ccm._ctrMode(c, m, e, n, d, h);
        a = sjcl.arrayBuffer.ccm._computeTag(c, m, e, l, d, j, h);
        if (!sjcl.bitArray.equal(g, a)) {
            throw new sjcl.exception.corrupt("ccm: tag doesn't match")
        }
        return m
    },
    _computeTag: function(e, k, g, q, f, n, o) {
        var l, c, m, j, d, b, p = sjcl.bitArray,
            h, a;
        m = sjcl.mode.ccm._macAdditionalData(e, q, g, f, n, o);
        if (k.byteLength !== 0) {
            j = new DataView(k);
            for (l = n; l < k.byteLength; l++) {
                j.setUint8(l, 0)
            }
            for (l = 0; l < j.byteLength; l += 16) {
                m[0] ^= j.getUint32(l);
                m[1] ^= j.getUint32(l + 4);
                m[2] ^= j.getUint32(l + 8);
                m[3] ^= j.getUint32(l + 12);
                m = e.encrypt(m)
            }
        }
        return sjcl.bitArray.clamp(m, f * 8)
    },
    _ctrMode: function(k, g, f, e, c, h) {
        var t, r, b, a, u, s, d, q, j = sjcl.bitArray,
            o = j._xor4,
            m = g.byteLength / 50,
            l = m;
        r = new DataView(new ArrayBuffer(16));
        r = j.concat([j.partial(8, h - 1)], f).concat([0, 0, 0]).slice(0, 4);
        e = j.bitSlice(o(e, k.encrypt(r)), 0, c * 8);
        r[3]++;
        if (r[3] === 0) {
            r[2]++
        }
        if (g.byteLength !== 0) {
            t = new DataView(g);
            for (q = 0; q < t.byteLength; q += 16) {
                if (q > m) {
                    sjcl.mode.ccm._callProgressListener(q / g.byteLength);
                    m += l
                }
                d = k.encrypt(r);
                b = t.getUint32(q);
                a = t.getUint32(q + 4);
                u = t.getUint32(q + 8);
                s = t.getUint32(q + 12);
                t.setUint32(q, b ^ d[0]);
                t.setUint32(q + 4, a ^ d[1]);
                t.setUint32(q + 8, u ^ d[2]);
                t.setUint32(q + 12, s ^ d[3]);
                r[3]++;
                if (r[3] === 0) {
                    r[2]++
                }
            }
        }
        return e
    }
};
if (typeof(ArrayBuffer) === "undefined") {
    (function(a) {
        a.ArrayBuffer = function() {};
        a.DataView = function() {}
    }(this))
}
sjcl.codec.arrayBuffer = {
    fromBits: function(a, h, g) {
        var c, f, b, e, d;
        h = h == undefined ? true : h;
        g = g || 8;
        if (a.length === 0) {
            return new ArrayBuffer(0)
        }
        b = sjcl.bitArray.bitLength(a) / 8;
        if (sjcl.bitArray.bitLength(a) % 8 !== 0) {
            throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly")
        }
        if (h && b % g !== 0) {
            b += g - (b % g)
        }
        e = new DataView(new ArrayBuffer(a.length * 4));
        for (f = 0; f < a.length; f++) {
            e.setUint32(f * 4, (a[f] << 32))
        }
        c = new DataView(new ArrayBuffer(b));
        if (c.byteLength === e.byteLength) {
            return e.buffer
        }
        d = e.byteLength < c.byteLength ? e.byteLength : c.byteLength;
        for (f = 0; f < d; f++) {
            c.setUint8(f, e.getUint8(f))
        }
        return c.buffer
    },
    toBits: function(c) {
        var f, d = [],
            a, g, e;
        if (c.byteLength === 0) {
            return []
        }
        g = new DataView(c);
        a = g.byteLength - g.byteLength % 4;
        for (var f = 0; f < a; f += 4) {
            d.push(g.getUint32(f))
        }
        if (g.byteLength % 4 != 0) {
            e = new DataView(new ArrayBuffer(4));
            for (var f = 0, b = g.byteLength % 4; f < b; f++) {
                e.setUint8(f + 4 - b, g.getUint8(a + f))
            }
            d.push(sjcl.bitArray.partial((g.byteLength % 4) * 8, e.getUint32(0)))
        }
        return d
    },
    hexDumpBuffer: function(a) {
        var e = new DataView(a);
        var b = "";
        var d = function(g, f) {
            g = g + "";
            return g.length >= f ? g : new Array(f - g.length + 1).join("0") + g
        };
        for (var c = 0; c < e.byteLength; c += 2) {
            if (c % 16 == 0) {
                b += ("\n" + (c).toString(16) + "\t")
            }
            b += (d(e.getUint16(c).toString(16), 4) + " ")
        }
        if (typeof console === undefined) {
            console = console || {
                log: function() {}
            }
        }
        console.log(b.toUpperCase())
    }
};
(function() {
    sjcl.hash.ripemd160 = function(i) {
        if (i) {
            this._h = i._h.slice(0);
            this._buffer = i._buffer.slice(0);
            this._length = i._length
        } else {
            this.reset()
        }
    };
    sjcl.hash.ripemd160.hash = function(i) {
        return (new sjcl.hash.ripemd160()).update(i).finalize()
    };
    sjcl.hash.ripemd160.prototype = {
        reset: function() {
            this._h = e.slice(0);
            this._buffer = [];
            this._length = 0;
            return this
        },
        update: function(y) {
            if (typeof y === "string") {
                y = sjcl.codec.utf8String.toBits(y)
            }
            var x, j = this._buffer = sjcl.bitArray.concat(this._buffer, y),
                v = this._length,
                u = this._length = v + sjcl.bitArray.bitLength(y);
            if (u > 0x1fffffffffffff) {
                throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits")
            }
            for (x = 512 + v - ((512 + v) & 0x1ff); x <= u; x += 512) {
                var z = j.splice(0, 16);
                for (var t = 0; t < 16; ++t) {
                    z[t] = m(z[t])
                }
                k.call(this, z)
            }
            return this
        },
        finalize: function() {
            var i = sjcl.bitArray.concat(this._buffer, [sjcl.bitArray.partial(1, 1)]),
                t = (this._length + 1) % 512,
                x = (t > 448 ? 512 : 448) - t % 448,
                y = x % 32;
            if (y > 0) {
                i = sjcl.bitArray.concat(i, [sjcl.bitArray.partial(y, 0)])
            }
            for (; x >= 32; x -= 32) {
                i.push(0)
            }
            i.push(m(this._length | 0));
            i.push(m(Math.floor(this._length / 0x100000000)));
            while (i.length) {
                var v = i.splice(0, 16);
                for (var j = 0; j < 16; ++j) {
                    v[j] = m(v[j])
                }
                k.call(this, v)
            }
            var u = this._h;
            this.reset();
            for (var j = 0; j < 5; ++j) {
                u[j] = m(u[j])
            }
            return u
        }
    };
    var e = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
    var d = [0, 1518500249, 1859775393, 2400959708, 2840853838];
    var c = [1352829926, 1548603684, 1836072691, 2053994217, 0];
    for (var g = 4; g >= 0; --g) {
        for (var f = 1; f < 16; ++f) {
            d.splice(g, 0, d[g]);
            c.splice(g, 0, c[g])
        }
    }
    var p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13];
    var o = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11];
    var l = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6];
    var h = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11];

    function b(i, t, j) {
        return i ^ t ^ j
    }

    function a(i, t, j) {
        return (i & t) | (~i & j)
    }

    function s(i, t, j) {
        return (i | ~t) ^ j
    }

    function r(i, t, j) {
        return (i & j) | (t & ~j)
    }

    function q(i, t, j) {
        return i ^ (t | ~j)
    }

    function n(j, i) {
        return (j << i) | (j >>> (32 - i))
    }

    function m(i) {
        return ((i & 255 << 0) << 24) | ((i & 255 << 8) << 8) | ((i & 255 << 16) >>> 8) | ((i & 255 << 24) >>> 24)
    }

    function k(t) {
        var w = this._h[0],
            E = this._h[1],
            A = this._h[2],
            u = this._h[3],
            D = this._h[4],
            v = this._h[0],
            C = this._h[1],
            z = this._h[2],
            i = this._h[3],
            B = this._h[4];
        var y = 0,
            x;
        for (; y < 16; ++y) {
            x = n(w + b(E, A, u) + t[p[y]] + d[y], l[y]) + D;
            w = D;
            D = u;
            u = n(A, 10);
            A = E;
            E = x;
            x = n(v + q(C, z, i) + t[o[y]] + c[y], h[y]) + B;
            v = B;
            B = i;
            i = n(z, 10);
            z = C;
            C = x
        }
        for (; y < 32; ++y) {
            x = n(w + a(E, A, u) + t[p[y]] + d[y], l[y]) + D;
            w = D;
            D = u;
            u = n(A, 10);
            A = E;
            E = x;
            x = n(v + r(C, z, i) + t[o[y]] + c[y], h[y]) + B;
            v = B;
            B = i;
            i = n(z, 10);
            z = C;
            C = x
        }
        for (; y < 48; ++y) {
            x = n(w + s(E, A, u) + t[p[y]] + d[y], l[y]) + D;
            w = D;
            D = u;
            u = n(A, 10);
            A = E;
            E = x;
            x = n(v + s(C, z, i) + t[o[y]] + c[y], h[y]) + B;
            v = B;
            B = i;
            i = n(z, 10);
            z = C;
            C = x
        }
        for (; y < 64; ++y) {
            x = n(w + r(E, A, u) + t[p[y]] + d[y], l[y]) + D;
            w = D;
            D = u;
            u = n(A, 10);
            A = E;
            E = x;
            x = n(v + a(C, z, i) + t[o[y]] + c[y], h[y]) + B;
            v = B;
            B = i;
            i = n(z, 10);
            z = C;
            C = x
        }
        for (; y < 80; ++y) {
            x = n(w + q(E, A, u) + t[p[y]] + d[y], l[y]) + D;
            w = D;
            D = u;
            u = n(A, 10);
            A = E;
            E = x;
            x = n(v + b(C, z, i) + t[o[y]] + c[y], h[y]) + B;
            v = B;
            B = i;
            i = n(z, 10);
            z = C;
            C = x
        }
        x = this._h[1] + A + i;
        this._h[1] = this._h[2] + u + B;
        this._h[2] = this._h[3] + D + v;
        this._h[3] = this._h[4] + w + C;
        this._h[4] = this._h[0] + E + z;
        this._h[0] = x
    }
})();
if (typeof module !== "undefined" && module.exports) {
    module.exports = sjcl
}
if (typeof define === "function") {
    define([], function() {
        return sjcl
    })
};