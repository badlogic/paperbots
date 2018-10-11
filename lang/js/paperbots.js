var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("Parser", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var SyntaxError = (function (_super) {
        __extends(SyntaxError, _super);
        function SyntaxError(message, expected, found, location) {
            var _this = _super.call(this) || this;
            _this.message = message;
            _this.expected = expected;
            _this.found = found;
            _this.location = location;
            _this.name = "SyntaxError";
            if (typeof Error.captureStackTrace === "function") {
                Error.captureStackTrace(_this, SyntaxError);
            }
            return _this;
        }
        SyntaxError.buildMessage = function (expected, found) {
            function hex(ch) {
                return ch.charCodeAt(0).toString(16).toUpperCase();
            }
            function literalEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, "\\\"")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function classEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/\]/g, "\\]")
                    .replace(/\^/g, "\\^")
                    .replace(/-/g, "\\-")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function describeExpectation(expectation) {
                switch (expectation.type) {
                    case "literal":
                        return "\"" + literalEscape(expectation.text) + "\"";
                    case "class":
                        var escapedParts = expectation.parts.map(function (part) {
                            return Array.isArray(part)
                                ? classEscape(part[0]) + "-" + classEscape(part[1])
                                : classEscape(part);
                        });
                        return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
                    case "any":
                        return "any character";
                    case "end":
                        return "end of input";
                    case "other":
                        return expectation.description;
                }
            }
            function describeExpected(expected1) {
                var descriptions = expected1.map(describeExpectation);
                var i;
                var j;
                descriptions.sort();
                if (descriptions.length > 0) {
                    for (i = 1, j = 1; i < descriptions.length; i++) {
                        if (descriptions[i - 1] !== descriptions[i]) {
                            descriptions[j] = descriptions[i];
                            j++;
                        }
                    }
                    descriptions.length = j;
                }
                switch (descriptions.length) {
                    case 1:
                        return descriptions[0];
                    case 2:
                        return descriptions[0] + " or " + descriptions[1];
                    default:
                        return descriptions.slice(0, -1).join(", ")
                            + ", or "
                            + descriptions[descriptions.length - 1];
                }
            }
            function describeFound(found1) {
                return found1 ? "\"" + literalEscape(found1) + "\"" : "end of input";
            }
            return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
        };
        return SyntaxError;
    }(Error));
    exports.SyntaxError = SyntaxError;
    function peg$parse(input, options) {
        options = options !== undefined ? options : {};
        var peg$FAILED = {};
        var peg$startRuleFunctions = { Program: peg$parseProgram };
        var peg$startRuleFunction = peg$parseProgram;
        var peg$c0 = function (stmts) {
            return stmts.map(function (element) {
                return element[1];
            });
        };
        var peg$c1 = "#";
        var peg$c2 = peg$literalExpectation("#", false);
        var peg$c3 = "\n";
        var peg$c4 = peg$literalExpectation("\n", false);
        var peg$c5 = peg$anyExpectation();
        var peg$c6 = function () {
            return { kind: "comment", value: text() };
        };
        var peg$c7 = function (id) {
            return { id: id };
        };
        var peg$c8 = peg$otherExpectation("function");
        var peg$c9 = "fun";
        var peg$c10 = peg$literalExpectation("fun", false);
        var peg$c11 = "(";
        var peg$c12 = peg$literalExpectation("(", false);
        var peg$c13 = ")";
        var peg$c14 = peg$literalExpectation(")", false);
        var peg$c15 = ":";
        var peg$c16 = peg$literalExpectation(":", false);
        var peg$c17 = "end";
        var peg$c18 = peg$literalExpectation("end", false);
        var peg$c19 = function (id, params, returnType, stmts) {
            return {
                kind: "function",
                name: id,
                params: params,
                returnTypeName: returnType != null ? returnType[2] : null,
                block: stmts.map(function (element) { return element[1]; }),
                location: location()
            };
        };
        var peg$c20 = function (name, typeName) {
            return {
                name: name,
                typeName: typeName
            };
        };
        var peg$c21 = ",";
        var peg$c22 = peg$literalExpectation(",", false);
        var peg$c23 = function (params) {
            if (params == null)
                return [];
            var head = params[0];
            params = params[1].map(function (element) {
                return element[3];
            });
            params.unshift(head);
            return params;
        };
        var peg$c24 = "record";
        var peg$c25 = peg$literalExpectation("record", false);
        var peg$c26 = function (name, fields) {
            return {
                kind: "record",
                name: name,
                fields: fields,
                location: location()
            };
        };
        var peg$c27 = function (fields) {
            if (fields == null)
                return [];
            var head = fields[0];
            fields = fields[1].map(function (element) {
                return element[1];
            });
            fields.unshift(head);
            return fields;
        };
        var peg$c28 = "var";
        var peg$c29 = peg$literalExpectation("var", false);
        var peg$c30 = "=";
        var peg$c31 = peg$literalExpectation("=", false);
        var peg$c32 = function (id, typeName, init) {
            return {
                kind: "variable",
                name: id,
                typeName: typeName ? typeName[2] : null,
                value: init,
                location: location()
            };
        };
        var peg$c33 = function (id, value) {
            return {
                kind: "assignment",
                id: id,
                value: value,
                location: location()
            };
        };
        var peg$c34 = "repeat";
        var peg$c35 = peg$literalExpectation("repeat", false);
        var peg$c36 = "times";
        var peg$c37 = peg$literalExpectation("times", false);
        var peg$c38 = function (count, stmts) {
            return {
                kind: "repeat",
                count: count,
                block: stmts.map(function (element) { return element[1]; }),
                location: location()
            };
        };
        var peg$c39 = "while";
        var peg$c40 = peg$literalExpectation("while", false);
        var peg$c41 = "do";
        var peg$c42 = peg$literalExpectation("do", false);
        var peg$c43 = function (cond, stmts) {
            return {
                kind: "while",
                condition: cond,
                block: stmts.map(function (element) { return element[1]; }),
                location: location()
            };
        };
        var peg$c44 = "if";
        var peg$c45 = peg$literalExpectation("if", false);
        var peg$c46 = "then";
        var peg$c47 = peg$literalExpectation("then", false);
        var peg$c48 = "elseif";
        var peg$c49 = peg$literalExpectation("elseif", false);
        var peg$c50 = "else";
        var peg$c51 = peg$literalExpectation("else", false);
        var peg$c52 = function (cond, trueBlock, elseIfs, falseBlock) {
            if (elseIfs.length > 0) {
                elseIfs[0] = 0;
            }
            return {
                kind: "if",
                condition: cond,
                trueBlock: trueBlock.map(function (element) { return element[1]; }),
                elseIfs: elseIfs,
                falseBlock: falseBlock ? falseBlock[2].map(function (element) { return element[1]; }) : [],
                location: location()
            };
        };
        var peg$c53 = "return";
        var peg$c54 = peg$literalExpectation("return", false);
        var peg$c55 = function (value) {
            return {
                kind: "return",
                value: value,
                location: location()
            };
        };
        var peg$c56 = "break";
        var peg$c57 = peg$literalExpectation("break", false);
        var peg$c58 = function () {
            return {
                kind: "break",
                location: location()
            };
        };
        var peg$c59 = "continue";
        var peg$c60 = peg$literalExpectation("continue", false);
        var peg$c61 = function () {
            return {
                kind: "continue",
                location: location()
            };
        };
        var peg$c62 = "and";
        var peg$c63 = peg$literalExpectation("and", false);
        var peg$c64 = "or";
        var peg$c65 = peg$literalExpectation("or", false);
        var peg$c66 = "xor";
        var peg$c67 = peg$literalExpectation("xor", false);
        var peg$c68 = function (head, tail) {
            if (tail.length == 0)
                return head;
            return tail.reduce(function (result, element) {
                return {
                    kind: "binaryOp",
                    operator: element[1],
                    left: result,
                    right: element[3],
                    location: location()
                };
            }, head);
        };
        var peg$c69 = "<=";
        var peg$c70 = peg$literalExpectation("<=", false);
        var peg$c71 = ">=";
        var peg$c72 = peg$literalExpectation(">=", false);
        var peg$c73 = "<";
        var peg$c74 = peg$literalExpectation("<", false);
        var peg$c75 = ">";
        var peg$c76 = peg$literalExpectation(">", false);
        var peg$c77 = "==";
        var peg$c78 = peg$literalExpectation("==", false);
        var peg$c79 = "!=";
        var peg$c80 = peg$literalExpectation("!=", false);
        var peg$c81 = "+";
        var peg$c82 = peg$literalExpectation("+", false);
        var peg$c83 = "-";
        var peg$c84 = peg$literalExpectation("-", false);
        var peg$c85 = "..";
        var peg$c86 = peg$literalExpectation("..", false);
        var peg$c87 = "*";
        var peg$c88 = peg$literalExpectation("*", false);
        var peg$c89 = "/";
        var peg$c90 = peg$literalExpectation("/", false);
        var peg$c91 = "not";
        var peg$c92 = peg$literalExpectation("not", false);
        var peg$c93 = function (op, factor) {
            if (!op)
                return factor;
            return {
                kind: "unaryOp",
                operator: op[0],
                value: factor,
                location: location()
            };
        };
        var peg$c94 = function (expr) { return expr; };
        var peg$c95 = peg$otherExpectation("function call or variable name");
        var peg$c96 = function (id, access) {
            if (access === null) {
                return {
                    kind: "variableAccess",
                    name: id,
                    location: location()
                };
            }
            else {
                if (access.length == 1 && access[0].kind == "arguments") {
                    return {
                        kind: "functionCall",
                        name: id,
                        args: access[0].args,
                        location: location()
                    };
                }
                var parent = {
                    kind: "variableAccess",
                    name: id,
                    location: location()
                };
                access.map(function (el) {
                    if (el.kind == "fieldAccess") {
                        el.record = parent;
                        parent = el;
                    }
                    else if (el.kind == "arrayAccess") {
                        el.array = parent;
                        parent = el;
                    }
                });
                return parent;
            }
        };
        var peg$c97 = ".";
        var peg$c98 = peg$literalExpectation(".", false);
        var peg$c99 = function (id) {
            return {
                kind: "fieldAccess",
                record: null,
                name: id,
                location: location()
            };
        };
        var peg$c100 = "[";
        var peg$c101 = peg$literalExpectation("[", false);
        var peg$c102 = "]";
        var peg$c103 = peg$literalExpectation("]", false);
        var peg$c104 = function (index) {
            return {
                kind: "arrayAccess",
                array: null,
                index: index,
                location: location()
            };
        };
        var peg$c105 = peg$otherExpectation("arguments");
        var peg$c106 = function (args) {
            if (args == null)
                return { kind: "arguments", args: [] };
            var head = args[0];
            args = args[1].map(function (element) {
                return element[3];
            });
            args.unshift(head);
            return {
                kind: "arguments",
                args: args
            };
        };
        var peg$c107 = peg$otherExpectation("number");
        var peg$c108 = /^[0-9]/;
        var peg$c109 = peg$classExpectation([["0", "9"]], false, false);
        var peg$c110 = function () {
            return {
                kind: "number",
                value: parseFloat(text()),
                location: location()
            };
        };
        var peg$c111 = peg$otherExpectation("boolean");
        var peg$c112 = "false";
        var peg$c113 = peg$literalExpectation("false", false);
        var peg$c114 = "true";
        var peg$c115 = peg$literalExpectation("true", false);
        var peg$c116 = function () {
            return {
                kind: "boolean",
                value: text() == "true",
                location: location()
            };
        };
        var peg$c117 = peg$otherExpectation("string");
        var peg$c118 = function (chars) {
            return {
                kind: "string",
                value: chars,
                location: location()
            };
        };
        var peg$c119 = "\"";
        var peg$c120 = peg$literalExpectation("\"", false);
        var peg$c121 = function (chars) { return chars.join(''); };
        var peg$c122 = "'";
        var peg$c123 = peg$literalExpectation("'", false);
        var peg$c124 = "\\";
        var peg$c125 = peg$literalExpectation("\\", false);
        var peg$c126 = function (char) { return char; };
        var peg$c127 = function (sequence) { return sequence; };
        var peg$c128 = "b";
        var peg$c129 = peg$literalExpectation("b", false);
        var peg$c130 = function () { return "\b"; };
        var peg$c131 = "f";
        var peg$c132 = peg$literalExpectation("f", false);
        var peg$c133 = function () { return "\f"; };
        var peg$c134 = "n";
        var peg$c135 = peg$literalExpectation("n", false);
        var peg$c136 = function () { return "\n"; };
        var peg$c137 = "r";
        var peg$c138 = peg$literalExpectation("r", false);
        var peg$c139 = function () { return "\r"; };
        var peg$c140 = "t";
        var peg$c141 = peg$literalExpectation("t", false);
        var peg$c142 = function () { return "\t"; };
        var peg$c143 = "v";
        var peg$c144 = peg$literalExpectation("v", false);
        var peg$c145 = function () { return "\x0B"; };
        var peg$c146 = peg$otherExpectation("identifier");
        var peg$c147 = function () {
            return {
                location: location(),
                value: text()
            };
        };
        var peg$c148 = /^[a-zA-Z_]/;
        var peg$c149 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false);
        var peg$c150 = /^[a-zA-Z_0-9]/;
        var peg$c151 = peg$classExpectation([["a", "z"], ["A", "Z"], "_", ["0", "9"]], false, false);
        var peg$c152 = peg$otherExpectation("whitespace");
        var peg$c153 = /^[ \t\n\r]/;
        var peg$c154 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false);
        var peg$c155 = function () { return "whitespace"; };
        var peg$currPos = 0;
        var peg$savedPos = 0;
        var peg$posDetailsCache = [{ line: 1, column: 1 }];
        var peg$maxFailPos = 0;
        var peg$maxFailExpected = [];
        var peg$silentFails = 0;
        var peg$result;
        if (options.startRule !== undefined) {
            if (!(options.startRule in peg$startRuleFunctions)) {
                throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
            }
            peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }
        function text() {
            return input.substring(peg$savedPos, peg$currPos);
        }
        function location() {
            return peg$computeLocation(peg$savedPos, peg$currPos);
        }
        function expected(description, location1) {
            location1 = location1 !== undefined
                ? location1
                : peg$computeLocation(peg$savedPos, peg$currPos);
            throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location1);
        }
        function error(message, location1) {
            location1 = location1 !== undefined
                ? location1
                : peg$computeLocation(peg$savedPos, peg$currPos);
            throw peg$buildSimpleError(message, location1);
        }
        function peg$literalExpectation(text1, ignoreCase) {
            return { type: "literal", text: text1, ignoreCase: ignoreCase };
        }
        function peg$classExpectation(parts, inverted, ignoreCase) {
            return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
        }
        function peg$anyExpectation() {
            return { type: "any" };
        }
        function peg$endExpectation() {
            return { type: "end" };
        }
        function peg$otherExpectation(description) {
            return { type: "other", description: description };
        }
        function peg$computePosDetails(pos) {
            var details = peg$posDetailsCache[pos];
            var p;
            if (details) {
                return details;
            }
            else {
                p = pos - 1;
                while (!peg$posDetailsCache[p]) {
                    p--;
                }
                details = peg$posDetailsCache[p];
                details = {
                    line: details.line,
                    column: details.column
                };
                while (p < pos) {
                    if (input.charCodeAt(p) === 10) {
                        details.line++;
                        details.column = 1;
                    }
                    else {
                        details.column++;
                    }
                    p++;
                }
                peg$posDetailsCache[pos] = details;
                return details;
            }
        }
        function peg$computeLocation(startPos, endPos) {
            var startPosDetails = peg$computePosDetails(startPos);
            var endPosDetails = peg$computePosDetails(endPos);
            return {
                start: {
                    offset: startPos,
                    line: startPosDetails.line,
                    column: startPosDetails.column
                },
                end: {
                    offset: endPos,
                    line: endPosDetails.line,
                    column: endPosDetails.column
                }
            };
        }
        function peg$fail(expected1) {
            if (peg$currPos < peg$maxFailPos) {
                return;
            }
            if (peg$currPos > peg$maxFailPos) {
                peg$maxFailPos = peg$currPos;
                peg$maxFailExpected = [];
            }
            peg$maxFailExpected.push(expected1);
        }
        function peg$buildSimpleError(message, location1) {
            return new SyntaxError(message, [], "", location1);
        }
        function peg$buildStructuredError(expected1, found, location1) {
            return new SyntaxError(SyntaxError.buildMessage(expected1, found), expected1, found, location1);
        }
        function peg$parseProgram() {
            var s0, s1, s2, s3, s4, s5, s6;
            s0 = peg$currPos;
            s1 = peg$parse_();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    s5 = peg$parseStatement();
                    if (s5 === peg$FAILED) {
                        s5 = peg$parseFunction();
                        if (s5 === peg$FAILED) {
                            s5 = peg$parseRecord();
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                            s4 = [s4, s5, s6];
                            s3 = s4;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        s5 = peg$parseStatement();
                        if (s5 === peg$FAILED) {
                            s5 = peg$parseFunction();
                            if (s5 === peg$FAILED) {
                                s5 = peg$parseRecord();
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                s4 = [s4, s5, s6];
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c0(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseComment() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 35) {
                s1 = peg$c1;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c2);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$currPos;
                peg$silentFails++;
                if (input.charCodeAt(peg$currPos) === 10) {
                    s5 = peg$c3;
                    peg$currPos++;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c4);
                    }
                }
                peg$silentFails--;
                if (s5 === peg$FAILED) {
                    s4 = undefined;
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s5 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c5);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s4 = [s4, s5];
                        s3 = s4;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$currPos;
                    peg$silentFails++;
                    if (input.charCodeAt(peg$currPos) === 10) {
                        s5 = peg$c3;
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c4);
                        }
                    }
                    peg$silentFails--;
                    if (s5 === peg$FAILED) {
                        s4 = undefined;
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c5);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s4 = [s4, s5];
                            s3 = s4;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 10) {
                        s3 = peg$c3;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c4);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c6();
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseType() {
            var s0, s1;
            s0 = peg$currPos;
            s1 = peg$parseIdentifier();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c7(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parseFunction() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 3) === peg$c9) {
                s1 = peg$c9;
                peg$currPos += 3;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c10);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseIdentifier();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 40) {
                                s5 = peg$c11;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c12);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parseParameters();
                                if (s6 !== peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 41) {
                                        s7 = peg$c13;
                                        peg$currPos++;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c14);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            s9 = peg$currPos;
                                            if (input.charCodeAt(peg$currPos) === 58) {
                                                s10 = peg$c15;
                                                peg$currPos++;
                                            }
                                            else {
                                                s10 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c16);
                                                }
                                            }
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parseType();
                                                    if (s12 !== peg$FAILED) {
                                                        s13 = peg$parse_();
                                                        if (s13 !== peg$FAILED) {
                                                            s10 = [s10, s11, s12, s13];
                                                            s9 = s10;
                                                        }
                                                        else {
                                                            peg$currPos = s9;
                                                            s9 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s9;
                                                        s9 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s9;
                                                    s9 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s9;
                                                s9 = peg$FAILED;
                                            }
                                            if (s9 === peg$FAILED) {
                                                s9 = null;
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    s11 = [];
                                                    s12 = peg$currPos;
                                                    s13 = peg$parse_();
                                                    if (s13 !== peg$FAILED) {
                                                        s14 = peg$parseStatement();
                                                        if (s14 !== peg$FAILED) {
                                                            s15 = peg$parse_();
                                                            if (s15 !== peg$FAILED) {
                                                                s13 = [s13, s14, s15];
                                                                s12 = s13;
                                                            }
                                                            else {
                                                                peg$currPos = s12;
                                                                s12 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s12;
                                                            s12 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s12;
                                                        s12 = peg$FAILED;
                                                    }
                                                    while (s12 !== peg$FAILED) {
                                                        s11.push(s12);
                                                        s12 = peg$currPos;
                                                        s13 = peg$parse_();
                                                        if (s13 !== peg$FAILED) {
                                                            s14 = peg$parseStatement();
                                                            if (s14 !== peg$FAILED) {
                                                                s15 = peg$parse_();
                                                                if (s15 !== peg$FAILED) {
                                                                    s13 = [s13, s14, s15];
                                                                    s12 = s13;
                                                                }
                                                                else {
                                                                    peg$currPos = s12;
                                                                    s12 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s12;
                                                                s12 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s12;
                                                            s12 = peg$FAILED;
                                                        }
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        s12 = peg$parse_();
                                                        if (s12 !== peg$FAILED) {
                                                            if (input.substr(peg$currPos, 3) === peg$c17) {
                                                                s13 = peg$c17;
                                                                peg$currPos += 3;
                                                            }
                                                            else {
                                                                s13 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                    peg$fail(peg$c18);
                                                                }
                                                            }
                                                            if (s13 !== peg$FAILED) {
                                                                peg$savedPos = s0;
                                                                s1 = peg$c19(s3, s6, s9, s11);
                                                                s0 = s1;
                                                            }
                                                            else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c8);
                }
            }
            return s0;
        }
        function peg$parseParameter() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$parseIdentifier();
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 58) {
                        s3 = peg$c15;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c16);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseType();
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c20(s1, s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseParameters() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8;
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = peg$parseParameter();
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$currPos;
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 44) {
                        s6 = peg$c21;
                        peg$currPos++;
                    }
                    else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c22);
                        }
                    }
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parse_();
                        if (s7 !== peg$FAILED) {
                            s8 = peg$parseParameter();
                            if (s8 !== peg$FAILED) {
                                s5 = [s5, s6, s7, s8];
                                s4 = s5;
                            }
                            else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    s4 = peg$currPos;
                    s5 = peg$parse_();
                    if (s5 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 44) {
                            s6 = peg$c21;
                            peg$currPos++;
                        }
                        else {
                            s6 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c22);
                            }
                        }
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parse_();
                            if (s7 !== peg$FAILED) {
                                s8 = peg$parseParameter();
                                if (s8 !== peg$FAILED) {
                                    s5 = [s5, s6, s7, s8];
                                    s4 = s5;
                                }
                                else {
                                    peg$currPos = s4;
                                    s4 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c23(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parseRecord() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c24) {
                s1 = peg$c24;
                peg$currPos += 6;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c25);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseIdentifier();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseFields();
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    if (input.substr(peg$currPos, 3) === peg$c17) {
                                        s7 = peg$c17;
                                        peg$currPos += 3;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c18);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c26(s3, s5);
                                        s0 = s1;
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseField() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$parseIdentifier();
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 58) {
                        s3 = peg$c15;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c16);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseType();
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c20(s1, s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseFields() {
            var s0, s1, s2, s3, s4, s5, s6;
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = peg$parseField();
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$currPos;
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parseField();
                    if (s6 !== peg$FAILED) {
                        s5 = [s5, s6];
                        s4 = s5;
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    s4 = peg$currPos;
                    s5 = peg$parse_();
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parseField();
                        if (s6 !== peg$FAILED) {
                            s5 = [s5, s6];
                            s4 = s5;
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c27(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parseStatement() {
            var s0;
            s0 = peg$parseVariable();
            if (s0 === peg$FAILED) {
                s0 = peg$parseAssignment();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseRepeat();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseWhile();
                        if (s0 === peg$FAILED) {
                            s0 = peg$parseIf();
                            if (s0 === peg$FAILED) {
                                s0 = peg$parseExpression();
                                if (s0 === peg$FAILED) {
                                    s0 = peg$parseComment();
                                    if (s0 === peg$FAILED) {
                                        s0 = peg$parseReturn();
                                        if (s0 === peg$FAILED) {
                                            s0 = peg$parseBreak();
                                            if (s0 === peg$FAILED) {
                                                s0 = peg$parseContinue();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return s0;
        }
        function peg$parseVariable() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 3) === peg$c28) {
                s1 = peg$c28;
                peg$currPos += 3;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c29);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseIdentifier();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$currPos;
                            if (input.charCodeAt(peg$currPos) === 58) {
                                s6 = peg$c15;
                                peg$currPos++;
                            }
                            else {
                                s6 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c16);
                                }
                            }
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parse_();
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parseType();
                                    if (s8 !== peg$FAILED) {
                                        s9 = peg$parse_();
                                        if (s9 !== peg$FAILED) {
                                            s6 = [s6, s7, s8, s9];
                                            s5 = s6;
                                        }
                                        else {
                                            peg$currPos = s5;
                                            s5 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s5;
                                        s5 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                            }
                            if (s5 === peg$FAILED) {
                                s5 = null;
                            }
                            if (s5 !== peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 61) {
                                    s6 = peg$c30;
                                    peg$currPos++;
                                }
                                else {
                                    s6 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c31);
                                    }
                                }
                                if (s6 !== peg$FAILED) {
                                    s7 = peg$parse_();
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parseExpression();
                                        if (s8 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s1 = peg$c32(s3, s5, s8);
                                            s0 = s1;
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseAssignment() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$parseIdentifier();
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 61) {
                        s3 = peg$c30;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c31);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseExpression();
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c33(s1, s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseRepeat() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c34) {
                s1 = peg$c34;
                peg$currPos += 6;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c35);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.substr(peg$currPos, 5) === peg$c36) {
                                s5 = peg$c36;
                                peg$currPos += 5;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c37);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    s7 = [];
                                    s8 = peg$currPos;
                                    s9 = peg$parse_();
                                    if (s9 !== peg$FAILED) {
                                        s10 = peg$parseStatement();
                                        if (s10 !== peg$FAILED) {
                                            s11 = peg$parse_();
                                            if (s11 !== peg$FAILED) {
                                                s9 = [s9, s10, s11];
                                                s8 = s9;
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s8;
                                        s8 = peg$FAILED;
                                    }
                                    while (s8 !== peg$FAILED) {
                                        s7.push(s8);
                                        s8 = peg$currPos;
                                        s9 = peg$parse_();
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parseStatement();
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s9 = [s9, s10, s11];
                                                    s8 = s9;
                                                }
                                                else {
                                                    peg$currPos = s8;
                                                    s8 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            if (input.substr(peg$currPos, 3) === peg$c17) {
                                                s9 = peg$c17;
                                                peg$currPos += 3;
                                            }
                                            else {
                                                s9 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c18);
                                                }
                                            }
                                            if (s9 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c38(s3, s7);
                                                s0 = s1;
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseWhile() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c39) {
                s1 = peg$c39;
                peg$currPos += 5;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c40);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.substr(peg$currPos, 2) === peg$c41) {
                                s5 = peg$c41;
                                peg$currPos += 2;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c42);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    s7 = [];
                                    s8 = peg$currPos;
                                    s9 = peg$parse_();
                                    if (s9 !== peg$FAILED) {
                                        s10 = peg$parseStatement();
                                        if (s10 !== peg$FAILED) {
                                            s11 = peg$parse_();
                                            if (s11 !== peg$FAILED) {
                                                s9 = [s9, s10, s11];
                                                s8 = s9;
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s8;
                                        s8 = peg$FAILED;
                                    }
                                    while (s8 !== peg$FAILED) {
                                        s7.push(s8);
                                        s8 = peg$currPos;
                                        s9 = peg$parse_();
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parseStatement();
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s9 = [s9, s10, s11];
                                                    s8 = s9;
                                                }
                                                else {
                                                    peg$currPos = s8;
                                                    s8 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            if (input.substr(peg$currPos, 3) === peg$c17) {
                                                s9 = peg$c17;
                                                peg$currPos += 3;
                                            }
                                            else {
                                                s9 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c18);
                                                }
                                            }
                                            if (s9 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c43(s3, s7);
                                                s0 = s1;
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseIf() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c44) {
                s1 = peg$c44;
                peg$currPos += 2;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c45);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.substr(peg$currPos, 4) === peg$c46) {
                                s5 = peg$c46;
                                peg$currPos += 4;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c47);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    s7 = [];
                                    s8 = peg$currPos;
                                    s9 = peg$parse_();
                                    if (s9 !== peg$FAILED) {
                                        s10 = peg$parseStatement();
                                        if (s10 !== peg$FAILED) {
                                            s11 = peg$parse_();
                                            if (s11 !== peg$FAILED) {
                                                s9 = [s9, s10, s11];
                                                s8 = s9;
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s8;
                                        s8 = peg$FAILED;
                                    }
                                    while (s8 !== peg$FAILED) {
                                        s7.push(s8);
                                        s8 = peg$currPos;
                                        s9 = peg$parse_();
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parseStatement();
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s9 = [s9, s10, s11];
                                                    s8 = s9;
                                                }
                                                else {
                                                    peg$currPos = s8;
                                                    s8 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s8;
                                                s8 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s8;
                                            s8 = peg$FAILED;
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            s9 = [];
                                            s10 = peg$currPos;
                                            if (input.substr(peg$currPos, 6) === peg$c48) {
                                                s11 = peg$c48;
                                                peg$currPos += 6;
                                            }
                                            else {
                                                s11 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c49);
                                                }
                                            }
                                            if (s11 !== peg$FAILED) {
                                                s12 = peg$parse_();
                                                if (s12 !== peg$FAILED) {
                                                    s13 = peg$parseExpression();
                                                    if (s13 !== peg$FAILED) {
                                                        s14 = peg$parse_();
                                                        if (s14 !== peg$FAILED) {
                                                            if (input.substr(peg$currPos, 4) === peg$c46) {
                                                                s15 = peg$c46;
                                                                peg$currPos += 4;
                                                            }
                                                            else {
                                                                s15 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                    peg$fail(peg$c47);
                                                                }
                                                            }
                                                            if (s15 !== peg$FAILED) {
                                                                s16 = peg$parse_();
                                                                if (s16 !== peg$FAILED) {
                                                                    s17 = [];
                                                                    s18 = peg$currPos;
                                                                    s19 = peg$parse_();
                                                                    if (s19 !== peg$FAILED) {
                                                                        s20 = peg$parseStatement();
                                                                        if (s20 !== peg$FAILED) {
                                                                            s21 = peg$parse_();
                                                                            if (s21 !== peg$FAILED) {
                                                                                s19 = [s19, s20, s21];
                                                                                s18 = s19;
                                                                            }
                                                                            else {
                                                                                peg$currPos = s18;
                                                                                s18 = peg$FAILED;
                                                                            }
                                                                        }
                                                                        else {
                                                                            peg$currPos = s18;
                                                                            s18 = peg$FAILED;
                                                                        }
                                                                    }
                                                                    else {
                                                                        peg$currPos = s18;
                                                                        s18 = peg$FAILED;
                                                                    }
                                                                    while (s18 !== peg$FAILED) {
                                                                        s17.push(s18);
                                                                        s18 = peg$currPos;
                                                                        s19 = peg$parse_();
                                                                        if (s19 !== peg$FAILED) {
                                                                            s20 = peg$parseStatement();
                                                                            if (s20 !== peg$FAILED) {
                                                                                s21 = peg$parse_();
                                                                                if (s21 !== peg$FAILED) {
                                                                                    s19 = [s19, s20, s21];
                                                                                    s18 = s19;
                                                                                }
                                                                                else {
                                                                                    peg$currPos = s18;
                                                                                    s18 = peg$FAILED;
                                                                                }
                                                                            }
                                                                            else {
                                                                                peg$currPos = s18;
                                                                                s18 = peg$FAILED;
                                                                            }
                                                                        }
                                                                        else {
                                                                            peg$currPos = s18;
                                                                            s18 = peg$FAILED;
                                                                        }
                                                                    }
                                                                    if (s17 !== peg$FAILED) {
                                                                        s11 = [s11, s12, s13, s14, s15, s16, s17];
                                                                        s10 = s11;
                                                                    }
                                                                    else {
                                                                        peg$currPos = s10;
                                                                        s10 = peg$FAILED;
                                                                    }
                                                                }
                                                                else {
                                                                    peg$currPos = s10;
                                                                    s10 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s10;
                                                                s10 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s10;
                                                            s10 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s10;
                                                        s10 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s10;
                                                    s10 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s10;
                                                s10 = peg$FAILED;
                                            }
                                            while (s10 !== peg$FAILED) {
                                                s9.push(s10);
                                                s10 = peg$currPos;
                                                if (input.substr(peg$currPos, 6) === peg$c48) {
                                                    s11 = peg$c48;
                                                    peg$currPos += 6;
                                                }
                                                else {
                                                    s11 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                        peg$fail(peg$c49);
                                                    }
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parse_();
                                                    if (s12 !== peg$FAILED) {
                                                        s13 = peg$parseExpression();
                                                        if (s13 !== peg$FAILED) {
                                                            s14 = peg$parse_();
                                                            if (s14 !== peg$FAILED) {
                                                                if (input.substr(peg$currPos, 4) === peg$c46) {
                                                                    s15 = peg$c46;
                                                                    peg$currPos += 4;
                                                                }
                                                                else {
                                                                    s15 = peg$FAILED;
                                                                    if (peg$silentFails === 0) {
                                                                        peg$fail(peg$c47);
                                                                    }
                                                                }
                                                                if (s15 !== peg$FAILED) {
                                                                    s16 = peg$parse_();
                                                                    if (s16 !== peg$FAILED) {
                                                                        s17 = [];
                                                                        s18 = peg$currPos;
                                                                        s19 = peg$parse_();
                                                                        if (s19 !== peg$FAILED) {
                                                                            s20 = peg$parseStatement();
                                                                            if (s20 !== peg$FAILED) {
                                                                                s21 = peg$parse_();
                                                                                if (s21 !== peg$FAILED) {
                                                                                    s19 = [s19, s20, s21];
                                                                                    s18 = s19;
                                                                                }
                                                                                else {
                                                                                    peg$currPos = s18;
                                                                                    s18 = peg$FAILED;
                                                                                }
                                                                            }
                                                                            else {
                                                                                peg$currPos = s18;
                                                                                s18 = peg$FAILED;
                                                                            }
                                                                        }
                                                                        else {
                                                                            peg$currPos = s18;
                                                                            s18 = peg$FAILED;
                                                                        }
                                                                        while (s18 !== peg$FAILED) {
                                                                            s17.push(s18);
                                                                            s18 = peg$currPos;
                                                                            s19 = peg$parse_();
                                                                            if (s19 !== peg$FAILED) {
                                                                                s20 = peg$parseStatement();
                                                                                if (s20 !== peg$FAILED) {
                                                                                    s21 = peg$parse_();
                                                                                    if (s21 !== peg$FAILED) {
                                                                                        s19 = [s19, s20, s21];
                                                                                        s18 = s19;
                                                                                    }
                                                                                    else {
                                                                                        peg$currPos = s18;
                                                                                        s18 = peg$FAILED;
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    peg$currPos = s18;
                                                                                    s18 = peg$FAILED;
                                                                                }
                                                                            }
                                                                            else {
                                                                                peg$currPos = s18;
                                                                                s18 = peg$FAILED;
                                                                            }
                                                                        }
                                                                        if (s17 !== peg$FAILED) {
                                                                            s11 = [s11, s12, s13, s14, s15, s16, s17];
                                                                            s10 = s11;
                                                                        }
                                                                        else {
                                                                            peg$currPos = s10;
                                                                            s10 = peg$FAILED;
                                                                        }
                                                                    }
                                                                    else {
                                                                        peg$currPos = s10;
                                                                        s10 = peg$FAILED;
                                                                    }
                                                                }
                                                                else {
                                                                    peg$currPos = s10;
                                                                    s10 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s10;
                                                                s10 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s10;
                                                            s10 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s10;
                                                        s10 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s10;
                                                    s10 = peg$FAILED;
                                                }
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    s11 = peg$currPos;
                                                    if (input.substr(peg$currPos, 4) === peg$c50) {
                                                        s12 = peg$c50;
                                                        peg$currPos += 4;
                                                    }
                                                    else {
                                                        s12 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                            peg$fail(peg$c51);
                                                        }
                                                    }
                                                    if (s12 !== peg$FAILED) {
                                                        s13 = peg$parse_();
                                                        if (s13 !== peg$FAILED) {
                                                            s14 = [];
                                                            s15 = peg$currPos;
                                                            s16 = peg$parse_();
                                                            if (s16 !== peg$FAILED) {
                                                                s17 = peg$parseStatement();
                                                                if (s17 !== peg$FAILED) {
                                                                    s18 = peg$parse_();
                                                                    if (s18 !== peg$FAILED) {
                                                                        s16 = [s16, s17, s18];
                                                                        s15 = s16;
                                                                    }
                                                                    else {
                                                                        peg$currPos = s15;
                                                                        s15 = peg$FAILED;
                                                                    }
                                                                }
                                                                else {
                                                                    peg$currPos = s15;
                                                                    s15 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s15;
                                                                s15 = peg$FAILED;
                                                            }
                                                            while (s15 !== peg$FAILED) {
                                                                s14.push(s15);
                                                                s15 = peg$currPos;
                                                                s16 = peg$parse_();
                                                                if (s16 !== peg$FAILED) {
                                                                    s17 = peg$parseStatement();
                                                                    if (s17 !== peg$FAILED) {
                                                                        s18 = peg$parse_();
                                                                        if (s18 !== peg$FAILED) {
                                                                            s16 = [s16, s17, s18];
                                                                            s15 = s16;
                                                                        }
                                                                        else {
                                                                            peg$currPos = s15;
                                                                            s15 = peg$FAILED;
                                                                        }
                                                                    }
                                                                    else {
                                                                        peg$currPos = s15;
                                                                        s15 = peg$FAILED;
                                                                    }
                                                                }
                                                                else {
                                                                    peg$currPos = s15;
                                                                    s15 = peg$FAILED;
                                                                }
                                                            }
                                                            if (s14 !== peg$FAILED) {
                                                                s12 = [s12, s13, s14];
                                                                s11 = s12;
                                                            }
                                                            else {
                                                                peg$currPos = s11;
                                                                s11 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s11;
                                                            s11 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s11;
                                                        s11 = peg$FAILED;
                                                    }
                                                    if (s11 === peg$FAILED) {
                                                        s11 = null;
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        s12 = peg$parse_();
                                                        if (s12 !== peg$FAILED) {
                                                            if (input.substr(peg$currPos, 3) === peg$c17) {
                                                                s13 = peg$c17;
                                                                peg$currPos += 3;
                                                            }
                                                            else {
                                                                s13 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                    peg$fail(peg$c18);
                                                                }
                                                            }
                                                            if (s13 !== peg$FAILED) {
                                                                peg$savedPos = s0;
                                                                s1 = peg$c52(s3, s7, s9, s11);
                                                                s0 = s1;
                                                            }
                                                            else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseReturn() {
            var s0, s1, s2, s3, s4;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c53) {
                s1 = peg$c53;
                peg$currPos += 6;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c54);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 === peg$FAILED) {
                        s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c55(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseBreak() {
            var s0, s1;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c56) {
                s1 = peg$c56;
                peg$currPos += 5;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c57);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c58();
            }
            s0 = s1;
            return s0;
        }
        function peg$parseContinue() {
            var s0, s1;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 8) === peg$c59) {
                s1 = peg$c59;
                peg$currPos += 8;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c60);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c61();
            }
            s0 = s1;
            return s0;
        }
        function peg$parseExpression() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parseRelational();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 3) === peg$c62) {
                        s5 = peg$c62;
                        peg$currPos += 3;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c63);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c64) {
                            s5 = peg$c64;
                            peg$currPos += 2;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c65);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.substr(peg$currPos, 3) === peg$c66) {
                                s5 = peg$c66;
                                peg$currPos += 3;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c67);
                                }
                            }
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parseRelational();
                            if (s7 !== peg$FAILED) {
                                s4 = [s4, s5, s6, s7];
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 3) === peg$c62) {
                            s5 = peg$c62;
                            peg$currPos += 3;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c63);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.substr(peg$currPos, 2) === peg$c64) {
                                s5 = peg$c64;
                                peg$currPos += 2;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c65);
                                }
                            }
                            if (s5 === peg$FAILED) {
                                if (input.substr(peg$currPos, 3) === peg$c66) {
                                    s5 = peg$c66;
                                    peg$currPos += 3;
                                }
                                else {
                                    s5 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c67);
                                    }
                                }
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseRelational();
                                if (s7 !== peg$FAILED) {
                                    s4 = [s4, s5, s6, s7];
                                    s3 = s4;
                                }
                                else {
                                    peg$currPos = s3;
                                    s3 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c68(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseRelational() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parseAddSubtract();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c69) {
                        s5 = peg$c69;
                        peg$currPos += 2;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c70);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c71) {
                            s5 = peg$c71;
                            peg$currPos += 2;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c72);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 60) {
                                s5 = peg$c73;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c74);
                                }
                            }
                            if (s5 === peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 62) {
                                    s5 = peg$c75;
                                    peg$currPos++;
                                }
                                else {
                                    s5 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c76);
                                    }
                                }
                                if (s5 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 2) === peg$c77) {
                                        s5 = peg$c77;
                                        peg$currPos += 2;
                                    }
                                    else {
                                        s5 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c78);
                                        }
                                    }
                                    if (s5 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 2) === peg$c79) {
                                            s5 = peg$c79;
                                            peg$currPos += 2;
                                        }
                                        else {
                                            s5 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c80);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parseAddSubtract();
                            if (s7 !== peg$FAILED) {
                                s4 = [s4, s5, s6, s7];
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c69) {
                            s5 = peg$c69;
                            peg$currPos += 2;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c70);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.substr(peg$currPos, 2) === peg$c71) {
                                s5 = peg$c71;
                                peg$currPos += 2;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c72);
                                }
                            }
                            if (s5 === peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 60) {
                                    s5 = peg$c73;
                                    peg$currPos++;
                                }
                                else {
                                    s5 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c74);
                                    }
                                }
                                if (s5 === peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 62) {
                                        s5 = peg$c75;
                                        peg$currPos++;
                                    }
                                    else {
                                        s5 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c76);
                                        }
                                    }
                                    if (s5 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 2) === peg$c77) {
                                            s5 = peg$c77;
                                            peg$currPos += 2;
                                        }
                                        else {
                                            s5 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c78);
                                            }
                                        }
                                        if (s5 === peg$FAILED) {
                                            if (input.substr(peg$currPos, 2) === peg$c79) {
                                                s5 = peg$c79;
                                                peg$currPos += 2;
                                            }
                                            else {
                                                s5 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c80);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseAddSubtract();
                                if (s7 !== peg$FAILED) {
                                    s4 = [s4, s5, s6, s7];
                                    s3 = s4;
                                }
                                else {
                                    peg$currPos = s3;
                                    s3 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c68(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseAddSubtract() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parseMultiplyDivide();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 43) {
                        s5 = peg$c81;
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c82);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 45) {
                            s5 = peg$c83;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c84);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.substr(peg$currPos, 2) === peg$c85) {
                                s5 = peg$c85;
                                peg$currPos += 2;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c86);
                                }
                            }
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parseMultiplyDivide();
                            if (s7 !== peg$FAILED) {
                                s4 = [s4, s5, s6, s7];
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 43) {
                            s5 = peg$c81;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c82);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 45) {
                                s5 = peg$c83;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c84);
                                }
                            }
                            if (s5 === peg$FAILED) {
                                if (input.substr(peg$currPos, 2) === peg$c85) {
                                    s5 = peg$c85;
                                    peg$currPos += 2;
                                }
                                else {
                                    s5 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c86);
                                    }
                                }
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseMultiplyDivide();
                                if (s7 !== peg$FAILED) {
                                    s4 = [s4, s5, s6, s7];
                                    s3 = s4;
                                }
                                else {
                                    peg$currPos = s3;
                                    s3 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c68(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseMultiplyDivide() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parseUnary();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 42) {
                        s5 = peg$c87;
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c88);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 47) {
                            s5 = peg$c89;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c90);
                            }
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parseUnary();
                            if (s7 !== peg$FAILED) {
                                s4 = [s4, s5, s6, s7];
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 42) {
                            s5 = peg$c87;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c88);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 47) {
                                s5 = peg$c89;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c90);
                                }
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseUnary();
                                if (s7 !== peg$FAILED) {
                                    s4 = [s4, s5, s6, s7];
                                    s3 = s4;
                                }
                                else {
                                    peg$currPos = s3;
                                    s3 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c68(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseUnary() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.substr(peg$currPos, 3) === peg$c91) {
                s2 = peg$c91;
                peg$currPos += 3;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c92);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse_();
                if (s3 === peg$FAILED) {
                    s3 = null;
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
                s1 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 45) {
                    s2 = peg$c83;
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c84);
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 === peg$FAILED) {
                        s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                        s2 = [s2, s3];
                        s1 = s2;
                    }
                    else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseFactor();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c93(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseFactor() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 40) {
                s1 = peg$c11;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c12);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 41) {
                                s5 = peg$c13;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c14);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c94(s3);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parseNumber();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseBoolean();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseString();
                        if (s0 === peg$FAILED) {
                            s0 = peg$parseVariableAccessOrFunctionCall();
                        }
                    }
                }
            }
            return s0;
        }
        function peg$parseVariableAccessOrFunctionCall() {
            var s0, s1, s2, s3;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$parseIdentifier();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parseArguments();
                if (s3 === peg$FAILED) {
                    s3 = peg$parseFieldAccess();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parseArrayAccess();
                    }
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parseArguments();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parseFieldAccess();
                        if (s3 === peg$FAILED) {
                            s3 = peg$parseArrayAccess();
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c96(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c95);
                }
            }
            return s0;
        }
        function peg$parseFieldAccess() {
            var s0, s1, s2;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 46) {
                s1 = peg$c97;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c98);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseIdentifier();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c99(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseArrayAccess() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 91) {
                s1 = peg$c100;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c101);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseExpression();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 93) {
                                s5 = peg$c102;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c103);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c104(s3);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseArguments() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 40) {
                s1 = peg$c11;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c12);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$currPos;
                    s4 = peg$parseExpression();
                    if (s4 !== peg$FAILED) {
                        s5 = [];
                        s6 = peg$currPos;
                        s7 = peg$parse_();
                        if (s7 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 44) {
                                s8 = peg$c21;
                                peg$currPos++;
                            }
                            else {
                                s8 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c22);
                                }
                            }
                            if (s8 !== peg$FAILED) {
                                s9 = peg$parse_();
                                if (s9 !== peg$FAILED) {
                                    s10 = peg$parseExpression();
                                    if (s10 !== peg$FAILED) {
                                        s7 = [s7, s8, s9, s10];
                                        s6 = s7;
                                    }
                                    else {
                                        peg$currPos = s6;
                                        s6 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s6;
                                    s6 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s6;
                            s6 = peg$FAILED;
                        }
                        while (s6 !== peg$FAILED) {
                            s5.push(s6);
                            s6 = peg$currPos;
                            s7 = peg$parse_();
                            if (s7 !== peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 44) {
                                    s8 = peg$c21;
                                    peg$currPos++;
                                }
                                else {
                                    s8 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c22);
                                    }
                                }
                                if (s8 !== peg$FAILED) {
                                    s9 = peg$parse_();
                                    if (s9 !== peg$FAILED) {
                                        s10 = peg$parseExpression();
                                        if (s10 !== peg$FAILED) {
                                            s7 = [s7, s8, s9, s10];
                                            s6 = s7;
                                        }
                                        else {
                                            peg$currPos = s6;
                                            s6 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s6;
                                        s6 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s6;
                                    s6 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s4 = [s4, s5];
                            s3 = s4;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 === peg$FAILED) {
                        s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 41) {
                                s5 = peg$c13;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c14);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c106(s3);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c105);
                }
            }
            return s0;
        }
        function peg$parseNumber() {
            var s0, s1, s2, s3, s4, s5;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            if (peg$c108.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c109);
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (peg$c108.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c109);
                        }
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 46) {
                    s3 = peg$c97;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c98);
                    }
                }
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    if (peg$c108.test(input.charAt(peg$currPos))) {
                        s5 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c109);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            if (peg$c108.test(input.charAt(peg$currPos))) {
                                s5 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c109);
                                }
                            }
                        }
                    }
                    else {
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        s3 = [s3, s4];
                        s2 = s3;
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 === peg$FAILED) {
                    s2 = null;
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c110();
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c107);
                }
            }
            return s0;
        }
        function peg$parseBoolean() {
            var s0, s1;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c112) {
                s1 = peg$c112;
                peg$currPos += 5;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c113);
                }
            }
            if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c114) {
                    s1 = peg$c114;
                    peg$currPos += 4;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c115);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c116();
            }
            s0 = s1;
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c111);
                }
            }
            return s0;
        }
        function peg$parseString() {
            var s0, s1;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$parseStringValue();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c118(s1);
            }
            s0 = s1;
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c117);
                }
            }
            return s0;
        }
        function peg$parseStringValue() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
                s1 = peg$c119;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c120);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parseDoubleStringCharacter();
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parseDoubleStringCharacter();
                }
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 34) {
                        s3 = peg$c119;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c120);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c121(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 39) {
                    s1 = peg$c122;
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c123);
                    }
                }
                if (s1 !== peg$FAILED) {
                    s2 = [];
                    s3 = peg$parseSingleStringCharacter();
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$parseSingleStringCharacter();
                    }
                    if (s2 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 39) {
                            s3 = peg$c122;
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c123);
                            }
                        }
                        if (s3 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c121(s2);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parseDoubleStringCharacter() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c119;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c120);
                }
            }
            if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s2 = peg$c124;
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c125);
                    }
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c5);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c126(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 92) {
                    s1 = peg$c124;
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c125);
                    }
                }
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseEscapeSequence();
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c127(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parseSingleStringCharacter() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 39) {
                s2 = peg$c122;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c123);
                }
            }
            if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s2 = peg$c124;
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c125);
                    }
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c5);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c126(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 92) {
                    s1 = peg$c124;
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c125);
                    }
                }
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseEscapeSequence();
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c127(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parseEscapeSequence() {
            var s0, s1;
            if (input.charCodeAt(peg$currPos) === 39) {
                s0 = peg$c122;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c123);
                }
            }
            if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 34) {
                    s0 = peg$c119;
                    peg$currPos++;
                }
                else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c120);
                    }
                }
                if (s0 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 92) {
                        s0 = peg$c124;
                        peg$currPos++;
                    }
                    else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c125);
                        }
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 98) {
                            s1 = peg$c128;
                            peg$currPos++;
                        }
                        else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c129);
                            }
                        }
                        if (s1 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c130();
                        }
                        s0 = s1;
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            if (input.charCodeAt(peg$currPos) === 102) {
                                s1 = peg$c131;
                                peg$currPos++;
                            }
                            else {
                                s1 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c132);
                                }
                            }
                            if (s1 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c133();
                            }
                            s0 = s1;
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                if (input.charCodeAt(peg$currPos) === 110) {
                                    s1 = peg$c134;
                                    peg$currPos++;
                                }
                                else {
                                    s1 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c135);
                                    }
                                }
                                if (s1 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s1 = peg$c136();
                                }
                                s0 = s1;
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    if (input.charCodeAt(peg$currPos) === 114) {
                                        s1 = peg$c137;
                                        peg$currPos++;
                                    }
                                    else {
                                        s1 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c138);
                                        }
                                    }
                                    if (s1 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c139();
                                    }
                                    s0 = s1;
                                    if (s0 === peg$FAILED) {
                                        s0 = peg$currPos;
                                        if (input.charCodeAt(peg$currPos) === 116) {
                                            s1 = peg$c140;
                                            peg$currPos++;
                                        }
                                        else {
                                            s1 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c141);
                                            }
                                        }
                                        if (s1 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s1 = peg$c142();
                                        }
                                        s0 = s1;
                                        if (s0 === peg$FAILED) {
                                            s0 = peg$currPos;
                                            if (input.charCodeAt(peg$currPos) === 118) {
                                                s1 = peg$c143;
                                                peg$currPos++;
                                            }
                                            else {
                                                s1 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c144);
                                                }
                                            }
                                            if (s1 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c145();
                                            }
                                            s0 = s1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return s0;
        }
        function peg$parseIdentifier() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseReserved();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseIdentifierStart();
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    s4 = peg$parseIdentifierPart();
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        s4 = peg$parseIdentifierPart();
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c147();
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c146);
                }
            }
            return s0;
        }
        function peg$parseIdentifierStart() {
            var s0;
            if (peg$c148.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c149);
                }
            }
            return s0;
        }
        function peg$parseIdentifierPart() {
            var s0;
            if (peg$c150.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c151);
                }
            }
            return s0;
        }
        function peg$parseReserved() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 3) === peg$c28) {
                s1 = peg$c28;
                peg$currPos += 3;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c29);
                }
            }
            if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 3) === peg$c9) {
                    s1 = peg$c9;
                    peg$currPos += 3;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c10);
                    }
                }
                if (s1 === peg$FAILED) {
                    if (input.substr(peg$currPos, 6) === peg$c48) {
                        s1 = peg$c48;
                        peg$currPos += 6;
                    }
                    else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c49);
                        }
                    }
                    if (s1 === peg$FAILED) {
                        if (input.substr(peg$currPos, 6) === peg$c34) {
                            s1 = peg$c34;
                            peg$currPos += 6;
                        }
                        else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c35);
                            }
                        }
                        if (s1 === peg$FAILED) {
                            if (input.substr(peg$currPos, 5) === peg$c39) {
                                s1 = peg$c39;
                                peg$currPos += 5;
                            }
                            else {
                                s1 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c40);
                                }
                            }
                            if (s1 === peg$FAILED) {
                                if (input.substr(peg$currPos, 2) === peg$c44) {
                                    s1 = peg$c44;
                                    peg$currPos += 2;
                                }
                                else {
                                    s1 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c45);
                                    }
                                }
                                if (s1 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 4) === peg$c46) {
                                        s1 = peg$c46;
                                        peg$currPos += 4;
                                    }
                                    else {
                                        s1 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c47);
                                        }
                                    }
                                    if (s1 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 4) === peg$c50) {
                                            s1 = peg$c50;
                                            peg$currPos += 4;
                                        }
                                        else {
                                            s1 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c51);
                                            }
                                        }
                                        if (s1 === peg$FAILED) {
                                            if (input.substr(peg$currPos, 5) === peg$c36) {
                                                s1 = peg$c36;
                                                peg$currPos += 5;
                                            }
                                            else {
                                                s1 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c37);
                                                }
                                            }
                                            if (s1 === peg$FAILED) {
                                                if (input.substr(peg$currPos, 4) === peg$c114) {
                                                    s1 = peg$c114;
                                                    peg$currPos += 4;
                                                }
                                                else {
                                                    s1 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                        peg$fail(peg$c115);
                                                    }
                                                }
                                                if (s1 === peg$FAILED) {
                                                    if (input.substr(peg$currPos, 5) === peg$c112) {
                                                        s1 = peg$c112;
                                                        peg$currPos += 5;
                                                    }
                                                    else {
                                                        s1 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                            peg$fail(peg$c113);
                                                        }
                                                    }
                                                    if (s1 === peg$FAILED) {
                                                        if (input.substr(peg$currPos, 3) === peg$c66) {
                                                            s1 = peg$c66;
                                                            peg$currPos += 3;
                                                        }
                                                        else {
                                                            s1 = peg$FAILED;
                                                            if (peg$silentFails === 0) {
                                                                peg$fail(peg$c67);
                                                            }
                                                        }
                                                        if (s1 === peg$FAILED) {
                                                            if (input.substr(peg$currPos, 3) === peg$c62) {
                                                                s1 = peg$c62;
                                                                peg$currPos += 3;
                                                            }
                                                            else {
                                                                s1 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                    peg$fail(peg$c63);
                                                                }
                                                            }
                                                            if (s1 === peg$FAILED) {
                                                                if (input.substr(peg$currPos, 2) === peg$c64) {
                                                                    s1 = peg$c64;
                                                                    peg$currPos += 2;
                                                                }
                                                                else {
                                                                    s1 = peg$FAILED;
                                                                    if (peg$silentFails === 0) {
                                                                        peg$fail(peg$c65);
                                                                    }
                                                                }
                                                                if (s1 === peg$FAILED) {
                                                                    if (input.substr(peg$currPos, 3) === peg$c17) {
                                                                        s1 = peg$c17;
                                                                        peg$currPos += 3;
                                                                    }
                                                                    else {
                                                                        s1 = peg$FAILED;
                                                                        if (peg$silentFails === 0) {
                                                                            peg$fail(peg$c18);
                                                                        }
                                                                    }
                                                                    if (s1 === peg$FAILED) {
                                                                        if (input.substr(peg$currPos, 6) === peg$c53) {
                                                                            s1 = peg$c53;
                                                                            peg$currPos += 6;
                                                                        }
                                                                        else {
                                                                            s1 = peg$FAILED;
                                                                            if (peg$silentFails === 0) {
                                                                                peg$fail(peg$c54);
                                                                            }
                                                                        }
                                                                        if (s1 === peg$FAILED) {
                                                                            if (input.substr(peg$currPos, 5) === peg$c56) {
                                                                                s1 = peg$c56;
                                                                                peg$currPos += 5;
                                                                            }
                                                                            else {
                                                                                s1 = peg$FAILED;
                                                                                if (peg$silentFails === 0) {
                                                                                    peg$fail(peg$c57);
                                                                                }
                                                                            }
                                                                            if (s1 === peg$FAILED) {
                                                                                if (input.substr(peg$currPos, 8) === peg$c59) {
                                                                                    s1 = peg$c59;
                                                                                    peg$currPos += 8;
                                                                                }
                                                                                else {
                                                                                    s1 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) {
                                                                                        peg$fail(peg$c60);
                                                                                    }
                                                                                }
                                                                                if (s1 === peg$FAILED) {
                                                                                    if (input.substr(peg$currPos, 3) === peg$c91) {
                                                                                        s1 = peg$c91;
                                                                                        peg$currPos += 3;
                                                                                    }
                                                                                    else {
                                                                                        s1 = peg$FAILED;
                                                                                        if (peg$silentFails === 0) {
                                                                                            peg$fail(peg$c92);
                                                                                        }
                                                                                    }
                                                                                    if (s1 === peg$FAILED) {
                                                                                        if (input.substr(peg$currPos, 6) === peg$c24) {
                                                                                            s1 = peg$c24;
                                                                                            peg$currPos += 6;
                                                                                        }
                                                                                        else {
                                                                                            s1 = peg$FAILED;
                                                                                            if (peg$silentFails === 0) {
                                                                                                peg$fail(peg$c25);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                s3 = peg$parseIdentifierPart();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                    s2 = undefined;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s1 = [s1, s2];
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parse_() {
            var s0, s1, s2;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            if (peg$c153.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c154);
                }
            }
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c153.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c154);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c155();
            }
            s0 = s1;
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c152);
                }
            }
            return s0;
        }
        peg$result = peg$startRuleFunction();
        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
            return peg$result;
        }
        else {
            if (peg$result !== peg$FAILED && peg$currPos < input.length) {
                peg$fail(peg$endExpectation());
            }
            throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
                ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
                : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
        }
    }
    exports.parse = peg$parse;
});
define("Compiler", ["require", "exports", "Parser"], function (require, exports, Parser_1) {
    "use strict";
    exports.__esModule = true;
    var CompilerError = (function () {
        function CompilerError(message, location) {
            this.message = message;
            this.location = location;
        }
        return CompilerError;
    }());
    exports.CompilerError = CompilerError;
    function assertNever(x) {
        throw new Error("This should never happen");
    }
    exports.NothingType = {
        declarationNode: null,
        name: "nothing"
    };
    exports.BooleanType = {
        declarationNode: null,
        name: "boolean"
    };
    exports.NumberType = {
        declarationNode: null,
        name: "number"
    };
    exports.StringType = {
        declarationNode: null,
        name: "string"
    };
    var Scopes = (function () {
        function Scopes() {
            this.scopes = new Array();
            this.nextSlotIndex = 0;
            this.push();
        }
        Scopes.prototype.push = function () {
            this.scopes.push({});
        };
        Scopes.prototype.pop = function () {
            this.scopes.pop();
        };
        Scopes.prototype.findSymbol = function (id) {
            var scopes = this.scopes;
            for (var i = scopes.length - 1; i >= 0; i--) {
                var scope = scopes[i];
                var symbol = scope[id.value];
                if (symbol) {
                    return symbol;
                }
            }
            return null;
        };
        Scopes.prototype.addSymbol = function (node) {
            var scopes = this.scopes;
            for (var i = scopes.length - 1; i >= 0; i--) {
                var scope = scopes[i];
                var other = scope[node.name.value];
                if (other) {
                    throw new CompilerError("Variable " + node.name.value + " already defined in line " + other.name.location.start.line + ", column " + other.name.location.start.column + ".", node.name.location);
                }
            }
            node.slotIndex = this.nextSlotIndex++;
            scopes[scopes.length - 1][node.name.value] = node;
        };
        return Scopes;
    }());
    function moduleToJson(module) {
        return JSON.stringify(module, function (key, value) {
            if (key == "declarationNode")
                return undefined;
            if (key == "location") {
                var loc = value;
                return loc.start.line + ":" + loc.start.column + " - " + loc.end.line + ":" + loc.end.column;
            }
            return value;
        }, 2);
    }
    exports.moduleToJson = moduleToJson;
    var ExternalFunctions = (function () {
        function ExternalFunctions() {
            this.functions = new Array();
            this.lookup = {};
            var externals = this;
            externals.addFunction("alert", [new ExternalFunctionParameter("message", "string")], "nothing", false, function (message) { alert(message); });
            externals.addFunction("alert", [new ExternalFunctionParameter("message", "number")], "nothing", false, function (message) { alert(message); });
            externals.addFunction("alert", [new ExternalFunctionParameter("message", "boolean")], "nothing", false, function (message) { alert(message); });
            externals.addFunction("print", [new ExternalFunctionParameter("value", "number")], "nothing", false, function (message) { console.log(message); });
            externals.addFunction("print", [new ExternalFunctionParameter("value", "boolean")], "nothing", false, function (message) { console.log(message); });
            externals.addFunction("print", [new ExternalFunctionParameter("value", "string")], "nothing", false, function (message) { console.log(message); });
            externals.addFunction("toString", [new ExternalFunctionParameter("value", "number")], "string", false, function (value) { return "" + value; });
            externals.addFunction("toString", [new ExternalFunctionParameter("value", "boolean")], "string", false, function (value) { return "" + value; });
            externals.addFunction("length", [new ExternalFunctionParameter("value", "string")], "number", false, function (value) { return value.length; });
            externals.addFunction("charAt", [
                new ExternalFunctionParameter("value", "string"),
                new ExternalFunctionParameter("index", "number")
            ], "string", false, function (value, index) { return value.charAt(index); });
            externals.addFunction("wait", [new ExternalFunctionParameter("milliSeconds", "number")], "number", true, function (milliSeconds) {
                var promise = {
                    completed: false,
                    value: 0
                };
                setTimeout(function () {
                    promise.value = milliSeconds;
                    promise.completed = true;
                }, milliSeconds);
                return promise;
            });
        }
        ExternalFunctions.prototype.addFunction = function (name, args, returnTypeName, async, fun) {
            var index = this.functions.length;
            var extFun = new ExternalFunction(name, args, returnTypeName, async, fun, index);
            this.functions.push(extFun);
            this.lookup[extFun.signature] = extFun;
        };
        return ExternalFunctions;
    }());
    exports.ExternalFunctions = ExternalFunctions;
    var ExternalFunctionParameter = (function () {
        function ExternalFunctionParameter(name, typeName) {
            this.name = name;
            this.typeName = typeName;
        }
        return ExternalFunctionParameter;
    }());
    exports.ExternalFunctionParameter = ExternalFunctionParameter;
    var ExternalFunction = (function () {
        function ExternalFunction(name, args, returnTypeName, async, fun, index) {
            this.name = name;
            this.args = args;
            this.returnTypeName = returnTypeName;
            this.async = async;
            this.fun = fun;
            this.index = index;
            this.argTypes = new Array();
            this.returnType = null;
            this.signature = name + "(" + args.map(function (arg) { return arg.typeName; }).join(",") + ")";
        }
        return ExternalFunction;
    }());
    exports.ExternalFunction = ExternalFunction;
    function compile(input, externalFunctions) {
        try {
            var ast = (Parser_1.parse(input));
            var functions = ast.filter(function (element) { return element.kind == "function"; });
            var records = ast.filter(function (element) { return element.kind == "record"; });
            var mainStatements = ast.filter(function (element) { return element.kind != "function" && element.kind != "record"; });
            var mainFunction = {
                kind: "function",
                name: {
                    location: {
                        start: { line: 0, column: 0, offset: 0 },
                        end: { line: 0, column: 0, offset: 0 }
                    },
                    value: "$main"
                },
                block: mainStatements,
                params: new Array(),
                returnType: exports.NothingType,
                returnTypeName: null,
                location: {
                    start: { line: 0, column: 0, offset: 0 },
                    end: { line: 0, column: 0, offset: 0 }
                },
                type: null
            };
            functions.unshift(mainFunction);
            var types = typeCheck(functions, records, externalFunctions);
            var codes = emitProgram(functions, externalFunctions);
            return {
                code: codes,
                ast: ast,
                types: types,
                externalFunctions: externalFunctions
            };
        }
        catch (e) {
            var error = e;
            throw new CompilerError(error.message, error.location);
        }
    }
    exports.compile = compile;
    function debug(msg) {
        throw new CompilerError(msg, null);
    }
    function nullLocation() {
        return {
            start: {
                line: 1,
                column: 1,
                offset: 0
            },
            end: {
                line: 1,
                column: 1,
                offset: 0
            }
        };
    }
    function functionSignature(fun) {
        switch (fun.kind) {
            case "function":
                return fun.name.value + "(" + fun.params.map(function (param) { return param.typeName.id.value; }).join(",") + ")";
            case "functionCall":
                return fun.name.value + "(" + fun.args.map(function (arg) { return arg.type.name; }).join(",") + ")";
        }
    }
    exports.functionSignature = functionSignature;
    function typeCheck(functions, records, externalFunctions) {
        var types = {
            all: {},
            functions: {},
            externalFunctions: {},
            records: {}
        };
        types.all[exports.NothingType.name] = exports.NothingType;
        types.all[exports.BooleanType.name] = exports.BooleanType;
        types.all[exports.NumberType.name] = exports.NumberType;
        types.all[exports.StringType.name] = exports.StringType;
        functions.forEach(function (fun) {
            var type = {
                declarationNode: fun,
                name: functionSignature(fun)
            };
            var other = types.all[type.name];
            if (other) {
                var otherLoc = other.declarationNode.location.start;
                throw new CompilerError("Function '" + other.name + "' already defined in line " + otherLoc.line + ".", fun.name.location);
            }
            if (externalFunctions.lookup[type.name])
                throw new CompilerError("Function '" + other.name + "' already defined externally.", fun.name.location);
            types.all[type.name] = type;
            types.functions[type.name] = type;
        });
        records.forEach(function (rec) {
            var type = {
                declarationNode: rec,
                name: rec.name.value
            };
            var other = types.all[type.name];
            if (other) {
                var otherLoc = other.declarationNode.location.start;
                throw new CompilerError("Record '" + other.name + "' already defined in line " + otherLoc.line + ".", rec.name.location);
            }
            types.all[type.name] = type;
            types.records[type.name] = type;
        });
        externalFunctions.functions.forEach(function (fun) {
            if (!fun.returnTypeName) {
                fun.returnTypeName = "nothing";
                fun.returnType = exports.NothingType;
            }
            else {
                var returnType = types.all[fun.returnTypeName];
                if (!returnType)
                    throw new CompilerError("Could not find type '" + fun.returnTypeName + "' for return value of external function '" + fun.name + "'.", nullLocation());
                fun.returnType = returnType;
            }
            fun.args.forEach(function (arg, index) {
                var argType = types.all[arg.typeName];
                if (!argType)
                    throw new CompilerError("Could not find type '" + arg + "' for argument " + (index + 1) + " of external function '" + fun.name + "'.", nullLocation());
                fun.argTypes.push(argType);
            });
            types.externalFunctions[fun.signature] = fun;
        });
        var _loop_1 = function (typeName) {
            var type = types.all[typeName];
            if (type.declarationNode && type.declarationNode.kind == "function") {
                var decl = type.declarationNode;
                var paramNames_1 = {};
                decl.params.forEach(function (param) {
                    var otherParam = paramNames_1[param.name.value];
                    if (otherParam) {
                        var otherLoc = otherParam.name.location.start;
                        throw new CompilerError("Duplicate parameter name '" + param.name.value + "' in function '" + type.name + ", see line " + otherLoc.line + ", column " + otherLoc.column + ".", param.name.location);
                    }
                    var paramType = types.all[param.typeName.id.value];
                    if (!paramType) {
                        throw new CompilerError("Unknown type '" + param.typeName.id.value + "' for parameter '" + param.name.value + "' of function '" + type.name + ".", param.typeName.id.location);
                    }
                    param.type = paramType;
                    paramNames_1[param.name.value] = param;
                });
                var returnTypeName = decl.returnTypeName ? decl.returnTypeName.id.value : null;
                var returnType = returnTypeName ? types.all[returnTypeName] : exports.NothingType;
                if (!returnType) {
                    throw new CompilerError("Unknown return type '" + returnTypeName, decl.returnTypeName.id.location);
                }
                decl.returnType = returnType;
            }
            else if (type.declarationNode && type.declarationNode.kind == "record") {
                var decl = type.declarationNode;
                var fieldNames_1 = {};
                decl.fields.forEach(function (field) {
                    var otherField = fieldNames_1[field.name.value];
                    if (otherField) {
                        var otherLoc = otherField.name.location.start;
                        throw new CompilerError("Duplicate field name '" + field.name.value + "' in record '" + type.name + "', see line " + otherLoc.line + ", column " + otherLoc.column + ".", field.name.location);
                    }
                    var fieldType = types.all[field.typeName.id.value];
                    if (!fieldType) {
                        throw new CompilerError("Unknown type '" + field.typeName.id.value + "' for field '" + field.name.value + "' of record '" + type.name + "'.", field.typeName.id.location);
                    }
                    field.type = type;
                    fieldNames_1[field.name.value] = field;
                });
            }
        };
        for (var typeName in types.all) {
            _loop_1(typeName);
        }
        functions.forEach(function (node) { return typeCheckRec(node, types, new Scopes(), node, null); });
        return types;
    }
    function typeCheckRec(node, types, scopes, enclosingFun, enclosingLoop) {
        switch (node.kind) {
            case "number":
                node.type = exports.NumberType;
                break;
            case "boolean":
                node.type = exports.BooleanType;
                break;
            case "string":
                node.type = exports.StringType;
                break;
            case "unaryOp":
                typeCheckRec(node.value, types, scopes, enclosingFun, enclosingLoop);
                switch (node.operator) {
                    case "not":
                        if (node.value.type != exports.BooleanType)
                            throw new CompilerError("Operand of " + node.operator + " operator is not a 'boolean', but a '" + node.value.type.name + "'.", node.value.location);
                        node.type = exports.BooleanType;
                        break;
                    case "-":
                        if (node.value.type != exports.NumberType)
                            throw new CompilerError("Operand of " + node.operator + " operator is not a 'number', but a '" + node.value.type.name + "'.", node.value.location);
                        node.type = exports.NumberType;
                        break;
                    default:
                        throw new CompilerError("Unknown operator " + node.operator + ".", node.location);
                }
                break;
            case "binaryOp":
                typeCheckRec(node.left, types, scopes, enclosingFun, enclosingLoop);
                typeCheckRec(node.right, types, scopes, enclosingFun, enclosingLoop);
                switch (node.operator) {
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                        if (node.left.type != exports.NumberType)
                            throw new CompilerError("Left operand of " + node.operator + " operator is not a 'number', but a '" + node.left.type.name + "'.", node.left.location);
                        if (node.right.type != exports.NumberType)
                            throw new CompilerError("Right operand of " + node.operator + " operator is not a 'number', but a '" + node.right.type.name + "'.", node.right.location);
                        node.type = exports.NumberType;
                        break;
                    case "..":
                        if (node.left.type != exports.StringType)
                            throw new CompilerError("Left operand of " + node.operator + " operator is not a 'string', but a '" + node.left.type.name + "'.", node.left.location);
                        if (node.right.type != exports.StringType)
                            throw new CompilerError("Right operand of " + node.operator + " operator is not a 'string', but a '" + node.right.type.name + "'.", node.right.location);
                        node.type = exports.StringType;
                        break;
                    case "<":
                    case "<=":
                    case ">":
                    case ">=":
                        if (node.left.type != exports.NumberType)
                            throw new CompilerError("Left operand of " + node.operator + " operator is not a 'number', but a '" + node.left.type.name + "'.", node.left.location);
                        if (node.right.type != exports.NumberType)
                            throw new CompilerError("Right operand of " + node.operator + " operator is not a 'number', but a '" + node.right.type.name + "'.", node.right.location);
                        node.type = exports.BooleanType;
                        break;
                    case "==":
                    case "!=":
                        if (node.left.type != node.right.type)
                            throw new CompilerError("Can not compare a '" + node.left.type.name + "' to a '" + node.right.type.name + "'.", node.location);
                        node.type = exports.BooleanType;
                        break;
                    case "and":
                    case "or":
                    case "xor":
                        if (node.left.type != exports.BooleanType)
                            throw new CompilerError("Left operand of " + node.operator + " operator is not a 'boolean', but a '" + node.left.type.name + "'.", node.left.location);
                        if (node.right.type != exports.BooleanType)
                            throw new CompilerError("Right operand of " + node.operator + " operator is not a 'boolean', but a '" + node.right.type.name + "'.", node.right.location);
                        node.type = exports.BooleanType;
                        break;
                    default:
                        throw new CompilerError("Unknown operator " + node.operator + ".", node.location);
                }
                break;
            case "if":
                typeCheckRec(node.condition, types, scopes, enclosingFun, enclosingLoop);
                if (node.condition.type != exports.BooleanType)
                    throw new CompilerError("Condition of if statement must be a 'boolean', but is a '" + node.condition.type.name, node.condition.location);
                scopes.push();
                node.trueBlock.forEach(function (child) { return typeCheckRec(child, types, scopes, enclosingFun, enclosingLoop); });
                scopes.pop();
                scopes.push();
                node.falseBlock.forEach(function (child) { return typeCheckRec(child, types, scopes, enclosingFun, enclosingLoop); });
                scopes.pop();
                break;
            case "while":
                typeCheckRec(node.condition, types, scopes, enclosingFun, enclosingLoop);
                if (node.condition.type != exports.BooleanType)
                    throw new CompilerError("Condition of while statement must be a 'boolean', but is a '" + node.condition.type.name, node.condition.location);
                scopes.push();
                node.block.forEach(function (child) { return typeCheckRec(child, types, scopes, enclosingFun, node); });
                scopes.pop();
                break;
            case "repeat":
                typeCheckRec(node.count, types, scopes, enclosingFun, enclosingLoop);
                if (node.count.type != exports.NumberType)
                    throw new CompilerError("Condition of repeat statement must be a 'number', but is a '" + node.count.type.name, node.count.location);
                scopes.push();
                node.block.forEach(function (child) { return typeCheckRec(child, types, scopes, enclosingFun, node); });
                scopes.pop();
                break;
            case "variable":
                typeCheckRec(node.value, types, scopes, enclosingFun, enclosingLoop);
                if (node.typeName) {
                    var type = types.all[node.typeName.id.value];
                    if (!type)
                        throw new CompilerError("Unknown type '" + node.typeName.id.value + "' for variable '" + node.name.value + "'.", node.typeName.id.location);
                    if (type != node.value.type)
                        throw new CompilerError("Can't assign a value of type '" + node.value.type.name + "' to variable '" + node.name.value + "' with type '" + type.name + ".", node.value.location);
                    node.type = type;
                }
                else {
                    node.type = node.value.type;
                }
                scopes.addSymbol(node);
                break;
            case "function":
                scopes.push();
                node.params.forEach(function (param) {
                    scopes.addSymbol(param);
                });
                node.block.forEach(function (child) { return typeCheckRec(child, types, scopes, enclosingFun, enclosingLoop); });
                scopes.pop();
                break;
            case "assignment": {
                typeCheckRec(node.value, types, scopes, enclosingFun, enclosingLoop);
                var symbol = scopes.findSymbol(node.id);
                if (!symbol)
                    throw new CompilerError("Can not find variable or parameter with name '" + node.id.value + "'.", node.id.location);
                if (symbol.type != node.value.type)
                    throw new CompilerError("Can not assign a value of type '" + node.value.type.name + "' to a variable of type '" + symbol.type.name + ".", node.location);
                break;
            }
            case "variableAccess": {
                var symbol = scopes.findSymbol(node.name);
                if (!symbol)
                    throw new CompilerError("Can not find variable or parameter with name '" + node.name.value + "'.", node.name.location);
                node.type = symbol.type;
                break;
            }
            case "functionCall": {
                node.args.forEach(function (arg) { return typeCheckRec(arg, types, scopes, enclosingFun, enclosingLoop); });
                var signature = functionSignature(node);
                var funType = types.functions[signature];
                var returnType;
                if (!funType) {
                    var externalFun = types.externalFunctions[signature];
                    if (!externalFun)
                        throw new CompilerError("Can not find function '" + signature + "'.", node.location);
                    returnType = externalFun.returnType;
                }
                else {
                    returnType = funType.declarationNode.returnType;
                }
                node.type = returnType;
                break;
            }
            case "record":
                throw new CompilerError("Type checking of node type " + node.kind + " implemented", node.location);
            case "return":
                if (enclosingFun == null) {
                    if (node.value)
                        throw new CompilerError("Can not return a value from the main program.", node.location);
                }
                else {
                    if (node.value)
                        typeCheckRec(node.value, types, scopes, enclosingFun, enclosingLoop);
                    if (enclosingFun.returnType != exports.NothingType && !node.value)
                        throw new CompilerError("Function '" + functionSignature(enclosingFun) + "' must return a value of type '" + enclosingFun.returnType.name + "'.", node.location);
                    if (enclosingFun.returnType == exports.NothingType && node.value)
                        throw new CompilerError("Function '" + functionSignature(enclosingFun) + "' must not return a value.", node.location);
                    if (enclosingFun.returnType != exports.NothingType && node.value && enclosingFun.returnType != node.value.type)
                        throw new CompilerError("Function '" + functionSignature(enclosingFun) + "' must return a value of type '" + enclosingFun.returnType.name + "', but a value of type '" + node.value.type.name + "' is returned.", node.location);
                }
                break;
            case "break":
            case "continue":
                if (!enclosingLoop)
                    throw new CompilerError("'" + node.kind + "' can only be used inside a 'while' or 'repeat' loop.", node.location);
                break;
            case "comment":
                break;
            case "fieldAccess":
            case "arrayAccess":
                throw new CompilerError("Field an array access not implemented yet.", node.location);
            default:
                assertNever(node);
        }
    }
    var EmitterContext = (function () {
        function EmitterContext(fun, functionLookup, externalFunctionLookup) {
            this.fun = fun;
            this.functionLookup = functionLookup;
            this.externalFunctionLookup = externalFunctionLookup;
            this.scopes = new Scopes();
            this.continues = new Array();
            this.breaks = new Array();
            this.lineInfoIndex = 0;
        }
        return EmitterContext;
    }());
    function emitProgram(functions, externalFunctions) {
        var functionCodes = Array();
        var functionLookup = {};
        functions.forEach(function (fun) {
            var funCode = {
                ast: fun,
                instructions: new Array(),
                lineInfos: new Array(),
                locals: new Array(),
                numParameters: fun.params.length,
                index: functionCodes.length
            };
            functionCodes.push(funCode);
            functionLookup[functionSignature(fun)] = funCode;
        });
        functionCodes.forEach(function (fun) { return emitFunction(new EmitterContext(fun, functionLookup, externalFunctions.lookup)); });
        return functionCodes;
    }
    function emitFunction(context) {
        var fun = context.fun;
        var statements = fun.ast.block;
        var funDecl = fun.ast;
        funDecl.params.forEach(function (param) {
            context.scopes.addSymbol(param);
            fun.locals.push(param);
        });
        emitStatementList(statements, context);
        if (fun.instructions.length == 0 || fun.instructions[fun.instructions.length - 1].kind != "return") {
            var lineInfo = fun.instructions.length > 0 ? context.fun.lineInfos[context.fun.instructions.length - 1] : null;
            context.fun.instructions.push({ kind: "return" });
            if (lineInfo)
                context.fun.lineInfos.push(lineInfo);
            else
                emitLineInfo(context.fun.lineInfos, 0, context.fun.ast.location.start.line, 1);
        }
    }
    function emitStatementList(statements, context) {
        statements.forEach(function (stmt) {
            emitAstNode(stmt, context, true);
            switch (stmt.kind) {
                case "number":
                case "boolean":
                case "string":
                case "unaryOp":
                case "binaryOp":
                case "variableAccess":
                case "fieldAccess":
                case "arrayAccess":
                    var lineInfo = context.fun.lineInfos[context.fun.instructions.length - 1];
                    emitLineInfo(context.fun.lineInfos, lineInfo.index, lineInfo.line, 1);
                    context.fun.instructions.push({ kind: "pop" });
                    break;
                case "functionCall": {
                    if (context.functionLookup[functionSignature(stmt)]) {
                        var calledFun = context.functionLookup[functionSignature(stmt)].ast;
                        if (calledFun.returnType && calledFun.returnType != exports.NothingType) {
                            var lineInfo_1 = context.fun.lineInfos[context.fun.instructions.length - 1];
                            emitLineInfo(context.fun.lineInfos, lineInfo_1.index, lineInfo_1.line, 1);
                            context.fun.instructions.push({ kind: "pop" });
                        }
                        break;
                    }
                    else {
                        var calledFun = context.externalFunctionLookup[functionSignature(stmt)];
                        if (calledFun.returnType && calledFun.returnType != exports.NothingType) {
                            var lineInfo_2 = context.fun.lineInfos[context.fun.instructions.length - 1];
                            emitLineInfo(context.fun.lineInfos, lineInfo_2.index, lineInfo_2.line, 1);
                            context.fun.instructions.push({ kind: "pop" });
                        }
                        break;
                    }
                }
                case "if":
                case "while":
                case "repeat":
                case "variable":
                case "function":
                case "assignment":
                case "record":
                case "return":
                case "break":
                case "continue":
                case "comment":
                    break;
                default:
                    assertNever(stmt);
            }
        });
    }
    function emitAstNode(node, context, isStatement) {
        var fun = context.fun;
        var instructions = fun.instructions;
        var functionLookup = context.functionLookup, scopes = context.scopes, externalFunctionLookup = context.externalFunctionLookup;
        var lastInsIndex = instructions.length;
        var lineInfos = fun.lineInfos;
        switch (node.kind) {
            case "number":
            case "boolean":
            case "string":
                instructions.push({ kind: "push", value: node.value });
                if (isStatement)
                    emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "binaryOp":
                emitAstNode(node.left, context, false);
                emitAstNode(node.right, context, false);
                if (node.operator == "..")
                    instructions.push({ kind: "stringConcat" });
                else
                    instructions.push({ kind: "binaryOp", operator: node.operator });
                if (isStatement)
                    emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "unaryOp":
                emitAstNode(node.value, context, false);
                instructions.push({ kind: "unaryOp", operator: node.operator });
                if (isStatement)
                    emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "variableAccess":
                instructions.push({ kind: "load", slotIndex: context.scopes.findSymbol(node.name).slotIndex });
                if (isStatement)
                    emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "variable":
                fun.locals.push(node);
                scopes.addSymbol(node);
                emitAstNode(node.value, context, false);
                instructions.push({ kind: "store", slotIndex: node.slotIndex });
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "assignment":
                emitAstNode(node.value, context, false);
                instructions.push({ kind: "store", slotIndex: context.scopes.findSymbol(node.id).slotIndex });
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "functionCall":
                node.args.forEach(function (arg) { return emitAstNode(arg, context, false); });
                if (functionLookup[functionSignature(node)]) {
                    instructions.push({ kind: "call", functionIndex: functionLookup[functionSignature(node)].index });
                }
                else {
                    var externalFun = externalFunctionLookup[functionSignature(node)];
                    instructions.push({ kind: "callExt", functionIndex: externalFun.index });
                }
                if (isStatement)
                    emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "if":
                emitAstNode(node.condition, context, false);
                var jumpToFalse = { kind: "jumpIfFalse", offset: 0 };
                var jumpPastFalse = { kind: "jump", offset: 0 };
                instructions.push(jumpToFalse);
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                context.lineInfoIndex++;
                scopes.push();
                emitStatementList(node.trueBlock, context);
                scopes.pop();
                instructions.push(jumpPastFalse);
                lineInfos.push(lineInfos[lineInfos.length - 1]);
                context.lineInfoIndex++;
                jumpToFalse.offset = instructions.length;
                scopes.push();
                emitStatementList(node.falseBlock, context);
                scopes.pop();
                jumpPastFalse.offset = instructions.length;
                break;
            case "while":
                var conditionIndex_1 = instructions.length;
                emitAstNode(node.condition, context, false);
                var jumpPastBlock = { kind: "jumpIfFalse", offset: 0 };
                instructions.push(jumpPastBlock);
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                context.lineInfoIndex++;
                scopes.push();
                emitStatementList(node.block, context);
                scopes.pop();
                context.continues.forEach(function (cont) { return cont.offset = conditionIndex_1; });
                context.continues.length = 0;
                instructions.push({ kind: "jump", offset: conditionIndex_1 });
                lineInfos.push(lineInfos[conditionIndex_1]);
                jumpPastBlock.offset = instructions.length;
                context.breaks.forEach(function (br) { return br.offset = instructions.length; });
                context.breaks.length = 0;
                break;
            case "repeat": {
                emitAstNode(node.count, context, false);
                var conditionIndex_2 = instructions.length;
                instructions.push({ kind: "dup" });
                instructions.push({ kind: "push", value: 0 });
                instructions.push({ kind: "binaryOp", operator: ">" });
                var jumpPastBlock_1 = { kind: "jumpIfFalse", offset: 0 };
                instructions.push(jumpPastBlock_1);
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                var headerLineInfo = lineInfos[lineInfos.length - 1];
                context.lineInfoIndex++;
                scopes.push();
                emitStatementList(node.block, context);
                scopes.pop();
                context.continues.forEach(function (cont) { return cont.offset = instructions.length; });
                context.continues.length = 0;
                lineInfos.push(lineInfos[conditionIndex_2]);
                lineInfos.push(lineInfos[conditionIndex_2]);
                lineInfos.push(lineInfos[conditionIndex_2]);
                instructions.push({ kind: "push", value: 1 });
                instructions.push({ kind: "binaryOp", operator: "-" });
                instructions.push({ kind: "jump", offset: conditionIndex_2 });
                jumpPastBlock_1.offset = instructions.length;
                context.breaks.forEach(function (br) { return br.offset = instructions.length; });
                context.breaks.length = 0;
                instructions.push({ kind: "pop" });
                lineInfos.push(headerLineInfo);
                break;
            }
            case "return":
                if (node.value)
                    emitAstNode(node.value, context, false);
                instructions.push({ kind: "return" });
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "break":
                var breakIns = { kind: "jump", offset: 0 };
                instructions.push(breakIns);
                context.breaks.push(breakIns);
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "continue":
                var continueIns = { kind: "jump", offset: 0 };
                instructions.push(continueIns);
                context.continues.push(continueIns);
                emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
                break;
            case "record":
            case "function":
                throw new CompilerError("Hit emission for record or function. This should never happen.", node.location);
            case "comment":
                break;
            case "fieldAccess":
            case "arrayAccess":
                throw new CompilerError("Field an array access not implemented yet.", node.location);
            default:
                assertNever(node);
        }
        if (isStatement)
            context.lineInfoIndex++;
    }
    function emitLineInfo(lineInfos, lineInfoIndex, sourceLine, numIns) {
        var lineInfo = { index: lineInfoIndex, line: sourceLine };
        while (numIns-- > 0) {
            lineInfos.push(lineInfo);
        }
    }
    var Slot = (function () {
        function Slot(symbol, value) {
            this.symbol = symbol;
            this.value = value;
        }
        return Slot;
    }());
    exports.Slot = Slot;
    var Frame = (function () {
        function Frame(code, slots, pc) {
            if (slots === void 0) { slots = new Array(); }
            if (pc === void 0) { pc = 0; }
            this.code = code;
            this.slots = slots;
            this.pc = pc;
            code.locals.forEach(function (v) { return slots.push(new Slot(v, null)); });
        }
        return Frame;
    }());
    exports.Frame = Frame;
    var VMState;
    (function (VMState) {
        VMState[VMState["Running"] = 0] = "Running";
        VMState[VMState["Completed"] = 1] = "Completed";
    })(VMState = exports.VMState || (exports.VMState = {}));
    var VirtualMachine = (function () {
        function VirtualMachine(functions, externalFunctions) {
            this.functions = functions;
            this.externalFunctions = externalFunctions;
            this.state = VMState.Running;
            this.frames = Array();
            this.stack = Array();
            this.frames.push(new Frame(this.functions[0]));
            this.state = VMState.Running;
        }
        VirtualMachine.prototype.run = function (numInstructions) {
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return;
            if (this.asyncPromise) {
                if (this.asyncPromise.completed) {
                    if (this.asyncFun.returnType != exports.NothingType) {
                        this.stack.push(this.asyncPromise.value);
                    }
                    this.asyncPromise = null;
                    this.asyncFun = null;
                }
            }
            while (!this.asyncPromise && numInstructions-- > 0) {
                this.step();
            }
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return;
        };
        VirtualMachine.prototype.stepOver = function () {
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return;
            if (this.asyncPromise) {
                if (this.asyncPromise.completed) {
                    if (this.asyncFun.returnType != exports.NothingType) {
                        this.stack.push(this.asyncPromise.value);
                    }
                    this.asyncPromise = null;
                    this.asyncFun = null;
                }
            }
            var frameIndex = this.frames.length - 1;
            var frame = this.frames[frameIndex];
            var lineInfoIndex = frame.code.lineInfos[frame.pc].index;
            while (true) {
                if (this.asyncPromise)
                    return;
                if (this.frames.length == 0)
                    return;
                var currFrameIndex = this.frames.length - 1;
                var currFrame = this.frames[currFrameIndex];
                var currLineInfoIndex = currFrame.code.lineInfos[currFrame.pc].index;
                if (currFrameIndex == frameIndex)
                    if (lineInfoIndex != currLineInfoIndex)
                        return;
                if (currFrameIndex < frameIndex)
                    return;
                this.step();
            }
        };
        VirtualMachine.prototype.stepInto = function () {
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return;
            if (this.asyncPromise) {
                if (this.asyncPromise.completed) {
                    if (this.asyncFun.returnType != exports.NothingType) {
                        this.stack.push(this.asyncPromise.value);
                    }
                    this.asyncPromise = null;
                    this.asyncFun = null;
                }
            }
            var frameIndex = this.frames.length - 1;
            var frame = this.frames[frameIndex];
            var lineInfoIndex = frame.code.lineInfos[frame.pc].index;
            while (true) {
                if (this.asyncPromise)
                    return;
                if (this.frames.length == 0)
                    return;
                var currFrameIndex = this.frames.length - 1;
                var currFrame = this.frames[currFrameIndex];
                var currLineInfoIndex = currFrame.code.lineInfos[currFrame.pc].index;
                if (lineInfoIndex != currLineInfoIndex)
                    return;
                if (currFrameIndex != frameIndex)
                    return;
                this.step();
            }
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return;
        };
        VirtualMachine.prototype.getLineNumber = function () {
            if (this.frames.length == 0)
                this.state = VMState.Completed;
            if (this.state == VMState.Completed)
                return -1;
            var frameIndex = this.frames.length - 1;
            var frame = this.frames[frameIndex];
            return frame.code.lineInfos[frame.pc].line;
        };
        VirtualMachine.prototype.step = function () {
            var _a = this, frames = _a.frames, stack = _a.stack, functions = _a.functions, externalFunctions = _a.externalFunctions;
            if (frames.length == 0) {
                this.state = VMState.Completed;
                return;
            }
            var frame = frames[frames.length - 1];
            var ins = frame.code.instructions[frame.pc];
            frame.pc++;
            switch (ins.kind) {
                case "pop":
                    stack.pop();
                    break;
                case "push":
                    stack.push(ins.value);
                    break;
                case "dup":
                    var value = stack.pop();
                    stack.push(value);
                    stack.push(value);
                    break;
                case "store":
                    frame.slots[ins.slotIndex].value = stack.pop();
                    break;
                case "load":
                    stack.push(frame.slots[ins.slotIndex].value);
                    break;
                case "jump":
                    frame.pc = ins.offset;
                    break;
                case "jumpIfTrue":
                    if (stack.pop())
                        frame.pc = ins.offset;
                    break;
                case "jumpIfFalse":
                    if (!stack.pop())
                        frame.pc = ins.offset;
                    break;
                case "call": {
                    var fun = functions[ins.functionIndex];
                    var newFrame = new Frame(fun);
                    newFrame.slots.length = fun.locals.length;
                    for (var i = fun.numParameters - 1; i >= 0; i--) {
                        newFrame.slots[i].value = stack.pop();
                    }
                    frames.push(newFrame);
                    break;
                }
                case "callExt": {
                    var fun = externalFunctions.functions[ins.functionIndex];
                    var extArgs = new Array(fun.args.length);
                    for (var i = extArgs.length - 1; i >= 0; i--) {
                        extArgs[i] = stack.pop();
                    }
                    var result = fun.fun.apply(fun.fun, extArgs);
                    if (fun.async) {
                        this.asyncFun = fun;
                        this.asyncPromise = result;
                    }
                    else {
                        if (fun.returnType != exports.NothingType) {
                            stack.push(result);
                        }
                    }
                    break;
                }
                case "return":
                    frames.pop();
                    break;
                case "unaryOp": {
                    var value_1 = stack.pop();
                    switch (ins.operator) {
                        case "not":
                            stack.push(!value_1);
                            break;
                        case "-":
                            stack.push(-value_1);
                            break;
                        default:
                            throw new Error("Unknown unary operator " + ins.operator);
                    }
                    break;
                }
                case "stringConcat": {
                    var right = stack.pop();
                    var left = stack.pop();
                    stack.push(left + right);
                    break;
                }
                case "binaryOp": {
                    var right = stack.pop();
                    var left = stack.pop();
                    switch (ins.operator) {
                        case "+":
                            stack.push(left + right);
                            break;
                        case "-":
                            stack.push(left - right);
                            break;
                        case "*":
                            stack.push(left * right);
                            break;
                        case "/":
                            stack.push(left / right);
                            break;
                        case "<=":
                            stack.push(left <= right);
                            break;
                        case ">=":
                            stack.push(left >= right);
                            break;
                        case "<":
                            stack.push(left < right);
                            break;
                        case ">":
                            stack.push(left > right);
                            break;
                        case "==":
                            stack.push(left === right);
                            break;
                        case "!=":
                            stack.push(left !== right);
                            break;
                        case "and":
                            stack.push(left && right);
                            break;
                        case "or":
                            stack.push(left || right);
                            break;
                        case "xor":
                            stack.push(!(left && right));
                            break;
                    }
                    break;
                }
                default:
                    assertNever(ins);
            }
        };
        return VirtualMachine;
    }());
    exports.VirtualMachine = VirtualMachine;
});
define("Utils", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var Input = (function () {
        function Input(element) {
            this.lastX = 0;
            this.lastY = 0;
            this.buttonDown = false;
            this.currTouch = null;
            this.listeners = new Array();
            this.element = element;
            this.setupCallbacks(element);
        }
        Input.prototype.setupCallbacks = function (element) {
            var _this = this;
            element.addEventListener("mousedown", function (ev) {
                if (ev instanceof MouseEvent) {
                    var rect = element.getBoundingClientRect();
                    var x = ev.clientX - rect.left;
                    var y = ev.clientY - rect.top;
                    var listeners = _this.listeners;
                    for (var i = 0; i < listeners.length; i++) {
                        listeners[i].down(x, y);
                    }
                    _this.lastX = x;
                    _this.lastY = y;
                    _this.buttonDown = true;
                }
            }, true);
            element.addEventListener("mousemove", function (ev) {
                if (ev instanceof MouseEvent) {
                    var rect = element.getBoundingClientRect();
                    var x = ev.clientX - rect.left;
                    var y = ev.clientY - rect.top;
                    var listeners = _this.listeners;
                    for (var i = 0; i < listeners.length; i++) {
                        if (_this.buttonDown) {
                            listeners[i].dragged(x, y);
                        }
                        else {
                            listeners[i].moved(x, y);
                        }
                    }
                    _this.lastX = x;
                    _this.lastY = y;
                }
            }, true);
            element.addEventListener("mouseup", function (ev) {
                if (ev instanceof MouseEvent) {
                    var rect = element.getBoundingClientRect();
                    var x = ev.clientX - rect.left;
                    var y = ev.clientY - rect.top;
                    var listeners = _this.listeners;
                    for (var i = 0; i < listeners.length; i++) {
                        listeners[i].up(x, y);
                    }
                    _this.lastX = x;
                    _this.lastY = y;
                    _this.buttonDown = false;
                }
            }, true);
            element.addEventListener("touchstart", function (ev) {
                if (_this.currTouch != null)
                    return;
                var touches = ev.changedTouches;
                for (var i = 0; i < touches.length; i++) {
                    var touch = touches[i];
                    var rect = element.getBoundingClientRect();
                    var x = touch.clientX - rect.left;
                    var y = touch.clientY - rect.top;
                    _this.currTouch = new Touch(touch.identifier, x, y);
                    break;
                }
                var listeners = _this.listeners;
                for (var i_1 = 0; i_1 < listeners.length; i_1++) {
                    listeners[i_1].down(_this.currTouch.x, _this.currTouch.y);
                }
                _this.lastX = _this.currTouch.x;
                _this.lastY = _this.currTouch.y;
                _this.buttonDown = true;
                ev.preventDefault();
            }, false);
            element.addEventListener("touchend", function (ev) {
                var touches = ev.changedTouches;
                for (var i = 0; i < touches.length; i++) {
                    var touch = touches[i];
                    if (_this.currTouch.identifier === touch.identifier) {
                        var rect = element.getBoundingClientRect();
                        var x = _this.currTouch.x = touch.clientX - rect.left;
                        var y = _this.currTouch.y = touch.clientY - rect.top;
                        var listeners = _this.listeners;
                        for (var i_2 = 0; i_2 < listeners.length; i_2++) {
                            listeners[i_2].up(x, y);
                        }
                        _this.lastX = x;
                        _this.lastY = y;
                        _this.buttonDown = false;
                        _this.currTouch = null;
                        break;
                    }
                }
                ev.preventDefault();
            }, false);
            element.addEventListener("touchcancel", function (ev) {
                var touches = ev.changedTouches;
                for (var i = 0; i < touches.length; i++) {
                    var touch = touches[i];
                    if (_this.currTouch.identifier === touch.identifier) {
                        var rect = element.getBoundingClientRect();
                        var x = _this.currTouch.x = touch.clientX - rect.left;
                        var y = _this.currTouch.y = touch.clientY - rect.top;
                        var listeners = _this.listeners;
                        for (var i_3 = 0; i_3 < listeners.length; i_3++) {
                            listeners[i_3].up(x, y);
                        }
                        console.log("End " + x + ", " + y);
                        _this.lastX = x;
                        _this.lastY = y;
                        _this.buttonDown = false;
                        _this.currTouch = null;
                        break;
                    }
                }
                ev.preventDefault();
            }, false);
            element.addEventListener("touchmove", function (ev) {
                if (_this.currTouch == null)
                    return;
                var touches = ev.changedTouches;
                for (var i = 0; i < touches.length; i++) {
                    var touch = touches[i];
                    if (_this.currTouch.identifier === touch.identifier) {
                        var rect = element.getBoundingClientRect();
                        var x = touch.clientX - rect.left;
                        var y = touch.clientY - rect.top;
                        var listeners = _this.listeners;
                        for (var i_4 = 0; i_4 < listeners.length; i_4++) {
                            listeners[i_4].dragged(x, y);
                        }
                        console.log("Drag " + x + ", " + y);
                        _this.lastX = _this.currTouch.x = x;
                        _this.lastY = _this.currTouch.y = y;
                        break;
                    }
                }
                ev.preventDefault();
            }, false);
        };
        Input.prototype.addListener = function (listener) {
            if (this.hasListener(listener))
                return;
            this.listeners.push(listener);
        };
        Input.prototype.removeListener = function (listener) {
            var idx = this.listeners.indexOf(listener);
            if (idx > -1) {
                this.listeners.splice(idx, 1);
            }
        };
        Input.prototype.hasListener = function (listener) {
            return this.listeners.indexOf(listener) >= 0;
        };
        return Input;
    }());
    exports.Input = Input;
    var Touch = (function () {
        function Touch(identifier, x, y) {
            this.identifier = identifier;
            this.x = x;
            this.y = y;
        }
        return Touch;
    }());
    exports.Touch = Touch;
    var TimeKeeper = (function () {
        function TimeKeeper() {
            this.maxDelta = 0.064;
            this.framesPerSecond = 0;
            this.delta = 0;
            this.totalTime = 0;
            this.lastTime = Date.now() / 1000;
            this.frameCount = 0;
            this.frameTime = 0;
        }
        TimeKeeper.prototype.update = function () {
            var now = Date.now() / 1000;
            this.delta = now - this.lastTime;
            this.frameTime += this.delta;
            this.totalTime += this.delta;
            if (this.delta > this.maxDelta)
                this.delta = this.maxDelta;
            this.lastTime = now;
            this.frameCount++;
            if (this.frameTime > 1) {
                this.framesPerSecond = this.frameCount / this.frameTime;
                this.frameTime = 0;
                this.frameCount = 0;
            }
        };
        return TimeKeeper;
    }());
    exports.TimeKeeper = TimeKeeper;
    var AssetManager = (function () {
        function AssetManager() {
            this.toLoad = new Array();
            this.loaded = {};
            this.error = {};
        }
        AssetManager.prototype.loadImage = function (url) {
            var _this = this;
            var img = new Image();
            var asset = { image: img, url: url };
            this.toLoad.push(asset);
            img.onload = function () {
                _this.loaded[asset.url] = asset;
                var idx = _this.toLoad.indexOf(asset);
                if (idx >= 0)
                    _this.toLoad.splice(idx, 1);
                console.log("Loaded image " + url);
            };
            img.onerror = function () {
                _this.loaded[asset.url] = asset;
                var idx = _this.toLoad.indexOf(asset);
                if (idx >= 0)
                    _this.toLoad.splice(idx, 1);
                console.log("Couldn't load image " + url);
            };
            img.src = url;
        };
        AssetManager.prototype.getImage = function (url) {
            return this.loaded[url].image;
        };
        AssetManager.prototype.hasMoreToLoad = function () {
            return this.toLoad.length;
        };
        return AssetManager;
    }());
    exports.AssetManager = AssetManager;
});
define("World", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var RobotAction;
    (function (RobotAction) {
        RobotAction[RobotAction["Forward"] = 0] = "Forward";
        RobotAction[RobotAction["TurnLeft"] = 1] = "TurnLeft";
        RobotAction[RobotAction["TurnRight"] = 2] = "TurnRight";
        RobotAction[RobotAction["None"] = 3] = "None";
    })(RobotAction = exports.RobotAction || (exports.RobotAction = {}));
    var RobotData = (function () {
        function RobotData(x, y, dirX, dirY, angle) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 15; }
            if (dirX === void 0) { dirX = 1; }
            if (dirY === void 0) { dirY = 0; }
            if (angle === void 0) { angle = 0; }
            this.x = x;
            this.y = y;
            this.dirX = dirX;
            this.dirY = dirY;
            this.angle = angle;
        }
        return RobotData;
    }());
    exports.RobotData = RobotData;
    var Robot = (function () {
        function Robot(data) {
            this.data = data;
            this.action = RobotAction.None;
            this.actionTime = 0;
            this.startX = 0;
            this.startY = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.startAngle = 0;
            this.targetAngle = 0;
        }
        Robot.prototype.turnLeft = function () {
            this.data.angle = this.data.angle - 90;
            var temp = this.data.dirX;
            this.data.dirX = -this.data.dirY;
            this.data.dirY = temp;
        };
        Robot.prototype.setAction = function (world, action) {
            if (this.action != RobotAction.None) {
                throw new Error("Can't set action while robot is executing previous action.");
            }
            this.action = action;
            switch (action) {
                case RobotAction.Forward:
                    this.startX = this.data.x;
                    this.startY = this.data.y;
                    this.targetX = this.data.x + this.data.dirX;
                    this.targetY = this.data.y + this.data.dirY;
                    console.log(this.targetX + ", " + this.targetY);
                    var tile = world.getTile(this.targetX, this.targetY);
                    if (tile && tile.kind == "wall") {
                        this.targetX = this.startX;
                        this.targetY = this.startY;
                    }
                    break;
                case RobotAction.TurnLeft: {
                    this.startAngle = this.data.angle;
                    this.targetAngle = this.data.angle - 90;
                    var temp = this.data.dirX;
                    this.data.dirX = -this.data.dirY;
                    this.data.dirY = temp;
                    console.log(this.targetAngle);
                    break;
                }
                case RobotAction.TurnRight: {
                    this.startAngle = this.data.angle;
                    this.targetAngle = this.data.angle + 90;
                    var temp = this.data.dirX;
                    this.data.dirX = this.data.dirY;
                    this.data.dirY = -temp;
                    console.log(this.targetAngle);
                    break;
                }
            }
            this.actionTime = 0;
        };
        Robot.prototype.update = function (delta) {
            this.actionTime += delta;
            switch (this.action) {
                case RobotAction.Forward: {
                    var percentage = this.actionTime / Robot.FORWARD_DURATION;
                    if (percentage >= 1) {
                        this.action = RobotAction.None;
                        this.data.x = this.targetX;
                        this.data.y = this.targetY;
                    }
                    else {
                        this.data.x = this.startX + (this.targetX - this.startX) * percentage;
                        this.data.y = this.startY + (this.targetY - this.startY) * percentage;
                    }
                    break;
                }
                case RobotAction.TurnLeft:
                case RobotAction.TurnRight: {
                    var percentage = this.actionTime / Robot.TURN_DURATION;
                    if (percentage >= 1) {
                        this.action = RobotAction.None;
                        this.data.angle = this.targetAngle;
                    }
                    else {
                        this.data.angle = this.startAngle + (this.targetAngle - this.startAngle) * percentage;
                    }
                    break;
                }
            }
            return this.action == RobotAction.None;
        };
        Robot.FORWARD_DURATION = 0.25;
        Robot.TURN_DURATION = 0.25;
        return Robot;
    }());
    exports.Robot = Robot;
    var WorldData = (function () {
        function WorldData(tiles, robot) {
            if (tiles === void 0) { tiles = Array(16 * 16); }
            if (robot === void 0) { robot = new RobotData(); }
            this.tiles = tiles;
            this.robot = robot;
        }
        return WorldData;
    }());
    exports.WorldData = WorldData;
    var World = (function () {
        function World(data) {
            this.data = data;
            this.robot = new Robot(data.robot);
        }
        World.prototype.getTile = function (x, y) {
            x = x | 0;
            y = y | 0;
            if (x < 0 || x >= World.WORLD_SIZE)
                return World.newWall();
            if (y < 0 || y >= World.WORLD_SIZE)
                return World.newWall();
            return this.data.tiles[x + y * World.WORLD_SIZE];
        };
        World.prototype.setTile = function (x, y, tile) {
            x = x | 0;
            y = y | 0;
            if (x < 0 || x >= World.WORLD_SIZE)
                return;
            if (y < 0 || y >= World.WORLD_SIZE)
                return;
            this.data.tiles[x + y * World.WORLD_SIZE] = tile;
        };
        World.prototype.update = function (delta) {
            this.robot.update(delta);
        };
        World.newWall = function () { return { kind: "wall" }; };
        World.newNumber = function (value) { return { kind: "number", value: value }; };
        World.newLetter = function (value) { return { kind: "letter", value: value }; };
        World.WORLD_SIZE = 16;
        return World;
    }());
    exports.World = World;
});
define("Paperbots", ["require", "exports", "Utils", "Compiler", "World"], function (require, exports, Utils_1, compiler, World_1) {
    "use strict";
    exports.__esModule = true;
    var SourceChanged = (function () {
        function SourceChanged(source, module) {
            this.source = source;
            this.module = module;
        }
        return SourceChanged;
    }());
    exports.SourceChanged = SourceChanged;
    var Run = (function () {
        function Run() {
        }
        return Run;
    }());
    exports.Run = Run;
    var Debug = (function () {
        function Debug() {
        }
        return Debug;
    }());
    exports.Debug = Debug;
    var Step = (function () {
        function Step(line) {
            this.line = line;
        }
        return Step;
    }());
    exports.Step = Step;
    var Stop = (function () {
        function Stop() {
        }
        return Stop;
    }());
    exports.Stop = Stop;
    var LineChange = (function () {
        function LineChange(line) {
            this.line = line;
        }
        return LineChange;
    }());
    exports.LineChange = LineChange;
    var Select = (function () {
        function Select(startLine, startColumn, endLine, endColumn) {
            this.startLine = startLine;
            this.startColumn = startColumn;
            this.endLine = endLine;
            this.endColumn = endColumn;
        }
        return Select;
    }());
    exports.Select = Select;
    var AnnounceExternalFunctions = (function () {
        function AnnounceExternalFunctions(functions) {
            this.functions = functions;
        }
        return AnnounceExternalFunctions;
    }());
    exports.AnnounceExternalFunctions = AnnounceExternalFunctions;
    var DEFAULT_SOURCE = "\nfun forwardUntilNumber (n: number)\n\twhile true do\n\t\tif scan() == n then return end\n\t\tforward()\n\tend\nend\n\nforwardUntilNumber(3)\n\nturnRight()\nforward()\nforward()\n\nrepeat 4 times\n\tforward()\n\tprint(3)\n\tforward()\n\tprint(3)\n\tturnRight()\nend\n\nprint(10)\nalert(\"Oh no!\")\n";
    var EventBus = (function () {
        function EventBus() {
            this.listeners = new Array();
        }
        EventBus.prototype.addListener = function (listener) {
            this.listeners.push(listener);
        };
        EventBus.prototype.event = function (event) {
            this.listeners.forEach(function (listener) { return listener.onEvent(event); });
        };
        return EventBus;
    }());
    exports.EventBus = EventBus;
    var Widget = (function () {
        function Widget(bus) {
            this.bus = bus;
        }
        return Widget;
    }());
    exports.Widget = Widget;
    var Paperbots2 = (function () {
        function Paperbots2(parent) {
            this.eventBus = new EventBus();
            this.editor = new Editor(this.eventBus);
            this["debugger"] = new Debugger(this.eventBus);
            this.playground = new Playground(this.eventBus);
            this.eventBus.addListener(this);
            this.eventBus.addListener(this.editor);
            this.eventBus.addListener(this["debugger"]);
            this.eventBus.addListener(this.playground);
            var dom = $("\n\t\t\t<div id=\"pb-main\">\n\t\t\t</div>\n\t\t");
            dom.append(this.playground.render());
            var editorAndDebugger = $("\n\t\t\t<div id =\"pb-editor-and-debugger\">\n\t\t\t</div>\n\t\t");
            editorAndDebugger.append(this.editor.render());
            editorAndDebugger.append(this["debugger"].render());
            dom.append(editorAndDebugger);
            $(parent).append(dom);
        }
        Paperbots2.prototype.onEvent = function (event) {
        };
        return Paperbots2;
    }());
    exports.Paperbots2 = Paperbots2;
    var Debugger = (function (_super) {
        __extends(Debugger, _super);
        function Debugger() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.lastModule = null;
            _this.selectedFrame = null;
            return _this;
        }
        Debugger.prototype.render = function () {
            var _this = this;
            var dom = this.dom = $("\n\t\t\t<div id=\"pb-debugger\">\n\t\t\t\t<div id=\"pb-debugger-locals-callstack\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<input id=\"pb-debugger-run\" type=\"button\" value=\"Run\">\n\t\t\t\t\t\t<input id=\"pb-debugger-debug\" type=\"button\" value=\"Debug\">\n\t\t\t\t\t\t<input id=\"pb-debugger-step-over\" type=\"button\" value=\"Step over\">\n\t\t\t\t\t\t<input id=\"pb-debugger-step-into\" type=\"button\" value=\"Step into\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"pb-debugger-label\">Parameters & Variables</div>\n\t\t\t\t\t<div id=\"pb-debugger-locals\"></div>\n\t\t\t\t\t<div class=\"pb-debugger-label\">Callstack</div>\n\t\t\t\t\t<div id=\"pb-debugger-callstack\"></div>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"pb-debugger-vm\"></div>\n\t\t\t</div>\n\t\t");
            this.run = dom.find("#pb-debugger-run");
            this.debug = dom.find("#pb-debugger-debug");
            this.stepOver = dom.find("#pb-debugger-step-over");
            this.stepInto = dom.find("#pb-debugger-step-into");
            this.locals = dom.find("#pb-debugger-locals");
            this.callstack = dom.find("#pb-debugger-callstack");
            this.vmState = dom.find("#pb-debugger-vm");
            this.run.click(function () {
                if (_this.run.val() == "Run") {
                    _this.vm = new compiler.VirtualMachine(_this.lastModule.code, _this.lastModule.externalFunctions);
                    ;
                    _this.run.val("Stop");
                    setEnabled(_this.debug, false);
                    _this.bus.event(new Run());
                    var advance_1 = function () {
                        if (!_this.vm)
                            return;
                        _this.vm.run(1000);
                        if (_this.vm.state == compiler.VMState.Completed) {
                            alert("Program complete.");
                            _this.bus.event(new Stop());
                            return;
                        }
                        requestAnimationFrame(advance_1);
                    };
                    requestAnimationFrame(advance_1);
                }
                else {
                    _this.bus.event(new Stop());
                }
            });
            this.debug.click(function () {
                if (_this.debug.val() == "Debug") {
                    _this.vm = new compiler.VirtualMachine(_this.lastModule.code, _this.lastModule.externalFunctions);
                    _this.debug.val("Stop");
                    setEnabled(_this.run, false);
                    setEnabled(_this.stepOver, true);
                    setEnabled(_this.stepInto, true);
                    _this.bus.event(new Debug());
                    _this.bus.event(new Step(_this.vm.getLineNumber()));
                }
                else {
                    _this.bus.event(new Stop());
                }
            });
            this.stepOver.click(function () {
                _this.vm.stepOver();
                _this.bus.event(new Step(_this.vm.getLineNumber()));
                if (_this.vm.state == compiler.VMState.Completed) {
                    alert("Program complete.");
                    _this.bus.event(new Stop());
                    return;
                }
            });
            this.stepInto.click(function () {
                _this.vm.stepInto();
                _this.bus.event(new Step(_this.vm.getLineNumber()));
                if (_this.vm.state == compiler.VMState.Completed) {
                    alert("Program complete.");
                    _this.bus.event(new Stop());
                    return;
                }
            });
            dom.find("input").attr("disabled", "true");
            return dom[0];
        };
        Debugger.prototype.renderState = function () {
            var _this = this;
            if (!this.locals)
                return;
            this.locals.empty();
            this.callstack.empty();
            this.vmState.empty();
            if (this.vm && this.vm.frames.length > 0) {
                this.vm.frames.slice(0).reverse().forEach(function (frame) {
                    var signature = compiler.functionSignature(frame.code.ast);
                    var lineInfo = frame.code.lineInfos[frame.pc];
                    var dom = $("\n\t\t\t\t\t<div class=\"pb-debugger-callstack-frame\">\n\t\t\t\t\t</div>\n\t\t\t\t");
                    dom.text(signature + " line " + lineInfo.line);
                    if (frame == _this.selectedFrame)
                        dom.addClass("selected");
                    dom.click(function () {
                        _this.selectedFrame = frame;
                        _this.bus.event(new LineChange(lineInfo.line));
                        _this.renderState();
                    });
                    _this.callstack.append(dom);
                });
                if (this.selectedFrame) {
                    this.selectedFrame.slots.forEach(function (slot) {
                        if (slot.value == null)
                            return;
                        var dom = $("\n\t\t\t\t\t\t<div class=\"pb-debugger-local\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t");
                        dom.text(slot.symbol.name.value + ": " + JSON.stringify(slot.value));
                        dom.click(function () {
                            var location = slot.symbol.name.location;
                            _this.bus.event(new Select(location.start.line, location.start.column, location.end.line, location.end.column));
                        });
                        _this.locals.append(dom);
                    });
                }
                this.renderVmState(this.vm);
            }
        };
        Debugger.prototype.renderVmState = function (vm) {
            var output = "";
            this.vm.frames.slice(0).reverse().forEach(function (frame) {
                output += compiler.functionSignature(frame.code.ast);
                output += "\nlocals:\n";
                frame.slots.forEach(function (slot, index) {
                    output += "   [" + index + "] " + slot.symbol.name.value + ": " + slot.value + "\n";
                });
                output += "\ninstructions:\n";
                var lastLineInfoIndex = -1;
                frame.code.instructions.forEach(function (ins, index) {
                    var line = frame.code.lineInfos[index];
                    if (lastLineInfoIndex != line.index) {
                        output += "\n";
                        lastLineInfoIndex = line.index;
                    }
                    output += (index == frame.pc ? " -> " : "    ") + JSON.stringify(ins) + " " + line.index + ":" + line.line + "\n";
                });
                output += "\n";
            });
            this.vmState.html(output);
        };
        Debugger.prototype.onEvent = function (event) {
            var _a = this, run = _a.run, debug = _a.debug, stepOver = _a.stepOver, stepInto = _a.stepInto, dom = _a.dom;
            if (event instanceof SourceChanged) {
                if (event.module) {
                    this.lastModule = event.module;
                    setEnabled(this.run, true);
                    setEnabled(this.debug, true);
                }
                else {
                    this.lastModule = null;
                    this.vm = null;
                    dom.find("input").attr("disabled", "true");
                }
            }
            else if (event instanceof Stop) {
                this.run.val("Run");
                this.debug.val("Debug");
                setEnabled(this.run, true);
                setEnabled(this.debug, true);
                setEnabled(this.stepOver, false);
                setEnabled(this.stepInto, false);
                this.vm = null;
            }
            else if (event instanceof Step) {
                if (this.vm && this.vm.frames.length > 0) {
                    this.selectedFrame = this.vm.frames[this.vm.frames.length - 1];
                }
            }
            this.renderState();
        };
        return Debugger;
    }(Widget));
    exports.Debugger = Debugger;
    function setEnabled(el, enabled) {
        if (enabled)
            el.removeAttr("disabled");
        else
            el.attr("disabled", "true");
    }
    var Editor = (function (_super) {
        __extends(Editor, _super);
        function Editor() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.markers = Array();
            _this.ext = new compiler.ExternalFunctions();
            return _this;
        }
        Editor.prototype.render = function () {
            var _this = this;
            var dom = $("\n\t\t\t<div id=\"pb-code-editor\">\n\t\t\t\t<div id=\"pb-code-editor-code-mirror\"></div>\n\t\t\t\t<div id=\"pb-code-editor-error\"></div>\n\t\t\t</div>\n\t\t");
            requestAnimationFrame(function () {
                _this.editor = CodeMirror(dom.find("#pb-code-editor-code-mirror")[0], {
                    tabSize: 3,
                    indentUnit: 3,
                    indentWithTabs: true,
                    styleActiveLine: true,
                    styleActiveSelected: true,
                    lineNumbers: true,
                    gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
                    fixedGutter: true,
                    extraKeys: {
                        "Tab": "indentAuto"
                    }
                });
                _this.editor.on("change", function (instance, change) {
                    var module = _this.compile();
                    _this.bus.event(new SourceChanged(_this.editor.getDoc().getValue(), module));
                });
                _this.editor.getDoc().setValue(DEFAULT_SOURCE.trim());
                var module = _this.compile();
                _this.bus.event(new SourceChanged(_this.editor.getDoc().getValue(), module));
            });
            this.error = dom.find("#pb-code-editor-error");
            this.error.hide();
            return dom[0];
        };
        Editor.prototype.compile = function () {
            this.markers.forEach(function (marker) { return marker.clear(); });
            this.markers.length = 0;
            try {
                var result = compiler.compile(this.editor.getDoc().getValue(), this.ext);
                this.error.hide();
                return result;
            }
            catch (e) {
                this.error.show();
                if (e["location"]) {
                    var err = e;
                    var loc = err.location;
                    var from = { line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0) };
                    var to = { line: loc.end.line - 1, ch: loc.end.column - 1 };
                    this.markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message }));
                    this.error.html("Error in line " + loc.start.line + ", column " + loc.start.column + ": " + err.message);
                }
                else {
                    var err = e;
                    this.error.html(err.message + (err.stack ? err.stack : ""));
                }
                return null;
            }
        };
        Editor.prototype.newBreakpointMarker = function () {
            var marker = $("\n\t\t<svg height=\"15\" width=\"15\">\n\t\t\t<circle cx=\"7\" cy=\"7\" r=\"7\" stroke-width=\"1\" fill=\"#cc0000\" />\n\t\t  </svg>\n\t\t");
            return marker[0];
        };
        Editor.prototype.setLine = function (line) {
            this.editor.getDoc().setCursor(line, 1);
        };
        Editor.prototype.onEvent = function (event) {
            if (event instanceof Run || event instanceof Debug) {
                this.editor.setOption("readOnly", true);
            }
            else if (event instanceof Stop) {
                this.editor.setOption("readOnly", false);
                this.editor.focus();
            }
            else if (event instanceof Step || event instanceof LineChange) {
                this.setLine(event.line - 1);
            }
            else if (event instanceof Select) {
                this.editor.getDoc().setSelection({ line: event.startLine - 1, ch: event.startColumn - 1 }, { line: event.endLine - 1, ch: event.endColumn - 1 });
            }
            else if (event instanceof AnnounceExternalFunctions) {
                this.ext = event.functions;
            }
        };
        return Editor;
    }(Widget));
    exports.Editor = Editor;
    function assertNever(x) {
        throw new Error("Unexpected object: " + x);
    }
    var Playground = (function (_super) {
        __extends(Playground, _super);
        function Playground(bus) {
            var _this = _super.call(this, bus) || this;
            _this.assets = new Utils_1.AssetManager();
            _this.selectedTool = "Robot";
            _this.lastWidth = 0;
            _this.cellSize = 0;
            _this.drawingSize = 0;
            _this.time = new Utils_1.TimeKeeper();
            _this.isRunning = false;
            _this.worldData = new World_1.WorldData();
            _this.world = new World_1.World(_this.worldData);
            return _this;
        }
        Playground.prototype.render = function () {
            var _this = this;
            this.container = $("\n\t\t\t<div id=\"pb-canvas-container\">\n\t\t\t\t<div id=\"pb-canvas-tools\">\n\t\t\t\t\t<div id=\"pb-canvas-tools-editing\">\n\t\t\t\t\t\t<input type=\"button\" value=\"Robot\" class=\"selected\">\n\t\t\t\t\t\t<input type=\"button\" value=\"Floor\">\n\t\t\t\t\t\t<input type=\"button\" value=\"Wall\">\n\t\t\t\t\t\t<input type=\"button\" value=\"Number\">\n\t\t\t\t\t\t<input type=\"button\" value=\"Letter\">\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<canvas id=\"pb-canvas\"></canvas>\n\t\t\t</div>\n\t\t");
            this.canvas = this.container.find("#pb-canvas")[0];
            this.ctx = this.canvas.getContext("2d");
            this.assets.loadImage("img/wall.png");
            this.assets.loadImage("img/floor.png");
            this.assets.loadImage("img/robot.png");
            requestAnimationFrame(function () { _this.draw(); });
            var tools = this.container.find("#pb-canvas-tools-editing input");
            for (var i = 0; i < tools.length; i++) {
                $(tools[i]).click(function (tool) {
                    var value = tool.target.value;
                    tools.removeClass("selected");
                    $(tool.target).addClass("selected");
                    _this.selectedTool = value;
                });
            }
            this.input = new Utils_1.Input(this.canvas);
            this.toolsHandler = {
                down: function (x, y) {
                    var cellSize = _this.canvas.width / (World_1.World.WORLD_SIZE + 1);
                    x = ((x / cellSize) | 0) - 1;
                    y = (((_this.canvas.height - y) / cellSize) | 0) - 1;
                    if (_this.selectedTool == "Wall") {
                        _this.world.setTile(x, y, World_1.World.newWall());
                    }
                    else if (_this.selectedTool == "Floor") {
                        _this.world.setTile(x, y, null);
                    }
                },
                up: function (x, y) {
                    var cellSize = _this.canvas.clientWidth / (World_1.World.WORLD_SIZE + 1);
                    x = ((x / cellSize) | 0) - 1;
                    y = (((_this.canvas.clientHeight - y) / cellSize) | 0) - 1;
                    if (_this.selectedTool == "Wall") {
                        _this.world.setTile(x, y, World_1.World.newWall());
                    }
                    else if (_this.selectedTool == "Floor") {
                        _this.world.setTile(x, y, null);
                    }
                    else if (_this.selectedTool == "Number") {
                        var number = null;
                        while (number == null) {
                            number = prompt("Please enter a number between 0-99.", "0");
                            if (!number)
                                return;
                            try {
                                number = parseInt(number, 10);
                                if (number < 0 || number > 99 || isNaN(number)) {
                                    alert("The number must be between 0-99.");
                                    number = null;
                                }
                            }
                            catch (e) {
                                alert("The number must be between 0-99.");
                                number = null;
                            }
                        }
                        _this.world.setTile(x, y, World_1.World.newNumber(number));
                    }
                    else if (_this.selectedTool == "Letter") {
                        var letter = null;
                        while (letter == null) {
                            letter = prompt("Please enter a letter", "a");
                            if (!letter)
                                return;
                            letter = letter.trim();
                            if (letter.length != 1) {
                                alert("Only a single letter is allowed.");
                                letter = null;
                            }
                        }
                        _this.world.setTile(x, y, World_1.World.newLetter(letter));
                    }
                    else if (_this.selectedTool == "Robot") {
                        if (_this.world.robot.data.x != x || _this.world.robot.data.y != y) {
                            _this.world.robot.data.x = Math.max(0, Math.min(World_1.World.WORLD_SIZE - 1, x));
                            _this.world.robot.data.y = Math.max(0, Math.min(World_1.World.WORLD_SIZE - 1, y));
                        }
                        else {
                            _this.world.robot.turnLeft();
                        }
                    }
                },
                moved: function (x, y) {
                },
                dragged: function (x, y) {
                    var cellSize = _this.canvas.clientWidth / (World_1.World.WORLD_SIZE + 1);
                    x = ((x / cellSize) | 0) - 1;
                    y = (((_this.canvas.clientHeight - y) / cellSize) | 0) - 1;
                    if (_this.selectedTool == "Wall") {
                        _this.world.setTile(x, y, World_1.World.newWall());
                    }
                    else if (_this.selectedTool == "Floor") {
                        _this.world.setTile(x, y, null);
                    }
                    else if (_this.selectedTool == "Robot") {
                        _this.world.robot.data.x = Math.max(0, Math.min(World_1.World.WORLD_SIZE - 1, x));
                        _this.world.robot.data.y = Math.max(0, Math.min(World_1.World.WORLD_SIZE - 1, y));
                    }
                }
            };
            this.input.addListener(this.toolsHandler);
            this.announceExternals();
            return this.container[0];
        };
        Playground.prototype.announceExternals = function () {
            var _this = this;
            var ext = new compiler.ExternalFunctions();
            ext.addFunction("forward", [], "nothing", true, function () {
                _this.world.robot.setAction(_this.world, World_1.RobotAction.Forward);
                var asyncResult = {
                    completed: false,
                    value: null
                };
                var check = function () {
                    if (_this.world.robot.action == World_1.RobotAction.None) {
                        asyncResult.completed = true;
                        return;
                    }
                    requestAnimationFrame(check);
                };
                requestAnimationFrame(check);
                return asyncResult;
            });
            ext.addFunction("turnLeft", [], "nothing", true, function () {
                _this.world.robot.setAction(_this.world, World_1.RobotAction.TurnLeft);
                var asyncResult = {
                    completed: false,
                    value: null
                };
                var check = function () {
                    if (_this.world.robot.action == World_1.RobotAction.None) {
                        asyncResult.completed = true;
                        return;
                    }
                    requestAnimationFrame(check);
                };
                requestAnimationFrame(check);
                return asyncResult;
            });
            ext.addFunction("turnRight", [], "nothing", true, function () {
                _this.world.robot.setAction(_this.world, World_1.RobotAction.TurnRight);
                var asyncResult = {
                    completed: false,
                    value: null
                };
                var check = function () {
                    if (_this.world.robot.action == World_1.RobotAction.None) {
                        asyncResult.completed = true;
                        return;
                    }
                    requestAnimationFrame(check);
                };
                requestAnimationFrame(check);
                return asyncResult;
            });
            ext.addFunction("print", [new compiler.ExternalFunctionParameter("value", "number")], "nothing", true, function (number) {
                if (number < 0 || number > 99 || isNaN(number)) {
                    alert("The number must be between 0-99.");
                    number = null;
                }
                var x = _this.world.robot.data.x + _this.world.robot.data.dirX;
                var y = _this.world.robot.data.y + _this.world.robot.data.dirY;
                var tile = _this.world.getTile(x, y);
                if (!tile || tile.kind != "wall") {
                    _this.world.setTile(x, y, World_1.World.newNumber(number));
                }
                var asyncResult = {
                    completed: false,
                    value: null
                };
                var num = 3;
                var check = function () {
                    if (num-- > 0) {
                        requestAnimationFrame(check);
                        return;
                    }
                    asyncResult.completed = true;
                };
                requestAnimationFrame(check);
                return asyncResult;
            });
            ext.addFunction("scan", [], "number", false, function () {
                var x = _this.world.robot.data.x + _this.world.robot.data.dirX;
                var y = _this.world.robot.data.y + _this.world.robot.data.dirY;
                var tile = _this.world.getTile(x, y);
                if (!tile || tile.kind != "number") {
                    return -1;
                }
                else {
                    return tile.value;
                }
            });
            ext.addFunction("isWallAhead", [], "boolean", false, function () {
                var x = _this.world.robot.data.x + _this.world.robot.data.dirX;
                var y = _this.world.robot.data.y + _this.world.robot.data.dirY;
                var tile = _this.world.getTile(x, y);
                return tile && tile.kind == "wall";
            });
            this.bus.event(new AnnounceExternalFunctions(ext));
        };
        Playground.prototype.onEvent = function (event) {
            if (event instanceof Stop) {
                this.input.addListener(this.toolsHandler);
                this.container.find("#pb-canvas-tools-editing input").each(function (index, element) {
                    setEnabled($(element), true);
                });
                this.world = new World_1.World(this.worldData);
                this.isRunning = false;
            }
            else if (event instanceof Run || event instanceof Debug) {
                this.input.removeListener(this.toolsHandler);
                this.container.find("#pb-canvas-tools-editing input").each(function (index, element) {
                    setEnabled($(element), false);
                });
                this.worldData = JSON.parse(JSON.stringify(this.world.data));
                this.isRunning = true;
            }
        };
        Playground.prototype.getWorld = function () {
            return this.world;
        };
        Playground.prototype.resize = function () {
            var canvas = this.canvas;
            var realToCSSPixels = window.devicePixelRatio;
            var displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
            var displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);
            if (canvas.width !== displayWidth || canvas.height != displayHeight) {
                console.log("Resize: canvas " + canvas.width + "x" + canvas.height + ", display " + displayWidth + "x" + displayHeight + ", ratio " + realToCSSPixels);
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
            this.cellSize = canvas.width / (World_1.World.WORLD_SIZE + 1);
            this.drawingSize = this.cellSize * World_1.World.WORLD_SIZE;
        };
        Playground.prototype.draw = function () {
            var _this = this;
            requestAnimationFrame(function () { _this.draw(); });
            this.time.update();
            if (this.isRunning) {
                this.world.update(this.time.delta);
            }
            var ctx = this.ctx;
            var canvas = this.canvas;
            this.resize();
            ctx.fillStyle = "#eeeeee";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.drawGrid();
            if (!this.assets.hasMoreToLoad()) {
                this.drawWorld();
            }
        };
        Playground.prototype.drawImage = function (img, x, y, w, h) {
            x |= 0;
            y |= 0;
            w |= 0;
            h |= 0;
            this.ctx.drawImage(img, x, this.drawingSize - y - h, w, h);
        };
        Playground.prototype.drawRotatedImage = function (img, x, y, w, h, angle) {
            x |= 0;
            y |= 0;
            w |= 0;
            h |= 0;
            this.ctx.save();
            this.ctx.translate(x + w / 2, this.drawingSize - y - h + h / 2);
            this.ctx.rotate(Math.PI / 180 * angle);
            this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
            this.ctx.restore();
        };
        Playground.prototype.drawText = function (text, x, y, color) {
            if (color === void 0) { color = "#000000"; }
            x |= 0;
            y |= 0;
            var ctx = this.ctx;
            ctx.fillStyle = color;
            ctx.font = this.cellSize * 0.5 + "pt monospace";
            var metrics = ctx.measureText(text);
            ctx.fillText(text, x + this.cellSize / 2 - metrics.width / 2, this.drawingSize - y - this.cellSize / 4);
        };
        Playground.prototype.drawWorld = function () {
            var ctx = this.ctx;
            var canvas = this.canvas;
            var cellSize = this.cellSize;
            var drawingSize = this.drawingSize;
            ctx.save();
            ctx.translate(this.cellSize, 0);
            for (var y = 0; y < World_1.World.WORLD_SIZE; y++) {
                for (var x = 0; x < World_1.World.WORLD_SIZE; x++) {
                    var img = null;
                    var obj = this.world.getTile(x, y);
                    if (!obj)
                        continue;
                    var wx = x * cellSize;
                    var wy = y * cellSize;
                    switch (obj.kind) {
                        case "wall":
                            img = this.assets.getImage("img/wall.png");
                            break;
                        case "number":
                            this.drawText("" + obj.value, wx, wy);
                            break;
                        case "letter":
                            this.drawText("" + obj.value, wx, wy);
                            break;
                        default: assertNever(obj);
                    }
                    if (img)
                        this.drawRotatedImage(img, wx, wy, cellSize, cellSize, 0);
                }
            }
            var robot = this.world.robot;
            this.drawRotatedImage(this.assets.getImage("img/robot.png"), robot.data.x * cellSize + cellSize * 0.05, robot.data.y * cellSize + cellSize * 0.05, cellSize * 0.9, cellSize * 0.9, robot.data.angle);
            ctx.restore();
        };
        Playground.prototype.drawGrid = function () {
            var ctx = this.ctx;
            var canvas = this.canvas;
            for (var y = 0; y < World_1.World.WORLD_SIZE; y++) {
                this.drawText("" + y, 0, y * this.cellSize, "#aaaaaa");
            }
            for (var x = 0; x < World_1.World.WORLD_SIZE; x++) {
                this.drawText("" + x, x * this.cellSize + this.cellSize, -this.cellSize, "#aaaaaa");
            }
            ctx.save();
            ctx.translate(this.cellSize, 0);
            ctx.strokeStyle = "#7f7f7f";
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            for (var y = 0; y <= World_1.World.WORLD_SIZE; y++) {
                ctx.moveTo(0, y * this.cellSize);
                ctx.lineTo(this.drawingSize, y * this.cellSize);
            }
            for (var x = 0; x <= World_1.World.WORLD_SIZE; x++) {
                ctx.moveTo(x * this.cellSize, 0);
                ctx.lineTo(x * this.cellSize, this.drawingSize);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        };
        return Playground;
    }(Widget));
    exports.Playground = Playground;
});
//# sourceMappingURL=paperbots.js.map