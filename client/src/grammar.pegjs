// PEG grammar for a minimal programming language

Program
  = _ stmts:(_ (Statement / Function / Record) _)* _
  {
    return stmts.map(function(element) {
      return element[1];
    });
  }

Comment
  = "#" (!"\n" .)* "\n"
  {
    return { kind: "comment", value: text() }
  }

Type
  = id:Identifier
  {
    return { id: id };
  }

Function "function"
  = "fun" _ id:Identifier _ "(" params:Parameters ")" _ returnType:(":" _ Type _)? _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "function",
      name: id,
      params: params,
      returnTypeName: returnType != null ? returnType[2] : null,
      block: stmts.map(function(element) { return element[1]; }),
      location: location()
    };
  }

Parameter
  = name:Identifier _ ":" _ typeName:Type
  {
    return {
      name: name,
      typeName: typeName
    }
  }

Parameters
  = params:(Parameter (_ "," _ Parameter)*)?
  {
    if (params == null) return [];
    var head = params[0];
    params = params[1].map(function(element) {
      return element[3];
    })
  	params.unshift(head);
    return params;
  }

Record
  = "record" _ name:Identifier _ fields:Fields _ "end"
  {
    return {
      kind: "record",
      name: name,
      fields: fields,
      location: location()
    }
  }

Field
  = name:Identifier _ ":" _ typeName:Type
  {
    return {
      name: name,
      typeName: typeName
    }
  }

Fields
  = fields:(Field (_ Field)*)?
  {
    if (fields == null) return [];
    var head = fields[0];
    fields = fields[1].map(function(element) {
      return element[1];
    })
  	fields.unshift(head);
    return fields;
  }


Statement
  = Variable
  / Assignment
  / Repeat
  / While
  / If
  / Expression
  / Comment
  / Return
  / Break
  / Continue

Variable
  = "var" _ id:Identifier _ typeName:(":" _ Type _)? "=" _ init: Expression
  {
    return {
      kind: "variable",
      name: id,
      typeName: typeName? typeName[2] : null,
      value: init,
      location: location()
    };
  }

Assignment
  = id:Identifier _ "=" _ value:Expression
  {
    return {
      kind: "assignment",
      id: id,
      value: value,
      location: location()
    };
  }

Repeat
  = "repeat" _ count:Expression _ "times" _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "repeat",
      count: count,
      block: stmts.map(function(element) { return element[1]; }),
      location: location()
    };
  }

While
  = "while" _ cond:Expression _ "do" _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "while",
      condition: cond,
      block: stmts.map(function(element) { return element[1]; }),
      location: location()
    };
  }

If
  = "if" _ cond:Expression _ "then"
  		_ trueBlock:(_ Statement _)* _
    elseIfs:("elseif" _ Expression _ "then"
        _ (_ Statement _)*)* _
    falseBlock:("else"
    	_ (_ Statement _)*)? _
    "end"
  {
    if (elseIfs.length > 0) {
    	elseIfs[0] = 0
    }

    return {
    	kind: "if",
      condition: cond,
      trueBlock: trueBlock.map(function(element) { return element[1]; }),
      elseIfs: elseIfs,
      falseBlock: falseBlock ? falseBlock[2].map(function(element) { return element[1]; }) : [],
      location: location()
	  }
  }

Return
  = "return" _ value:Expression? _
  {
    return {
      kind: "return",
      value: value,
      location: location()
    }
  }

Break
  = "break"
  {
    return {
      kind: "break",
      location: location()
    }
  }

Continue
  = "continue"
  {
    return {
      kind: "continue",
      location: location()
    }
  }

Expression
  = head:Relational tail:(_ ("and" / "or" / "xor" ) _ Relational)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3],
          location: location()
        }
    }, head);
  }

Relational
  = head:AddSubtract tail:(_ ("<=" / ">=" / "<" / ">" / "==" / "!=") _ AddSubtract)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3],
          location: location()
        }
    }, head);
  }

AddSubtract
  = head:MultiplyDivide tail:(_ ("+" / "-" / "..") _ MultiplyDivide)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3],
          location: location()
        }
    }, head);
  }

MultiplyDivide
  = head:Unary tail:(_ ("*" / "/") _ Unary)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3],
          location: location()
        }
    }, head);
  }

Unary
  = op:("not" _?/ "-" _?)? factor:Factor
  {
  	if (!op) return factor;
    return {
    	kind: "unaryOp",
        operator: op[0],
        value: factor,
        location: location() // TODO should use location of op
    };
  }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Number
  / Boolean
  / String
  / VariableAccessOrFunctionCall

VariableAccessOrFunctionCall "function call or variable name"
  = id:Identifier access:(Arguments / FieldAccess / ArrayAccess)*
  {
  	if (access === null) {
      return {
        kind: "variableAccess",
        name: id,
        location: location()
      }
    } else {
    	if (access.length == 1 && access[0].kind == "arguments") {
          return {
            kind: "functionCall",
            name: id,
            args: access[0].args,
            location: location()
          }
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
            } else if (el.kind == "arrayAccess") {
            	el.array = parent;
            	parent = el;
            }
        });
        return parent;
    }
  }

FieldAccess
  = "." id: Identifier
  {
  	return {
		kind: "fieldAccess",
        record: null,
		name: id,
        location: location()
    }
  }

ArrayAccess
  = "[" _ index: Expression _ "]"
  {
  	return {
    	kind: "arrayAccess",
        array: null,
        index: index,
        location: location()
    }
  }

Arguments "arguments"
  = "(" _ args:(Expression ( _ "," _ Expression )* ) ? _ ")"
  {
    if (args == null) return { kind: "arguments", args: [] };
    var head = args[0];
    args = args[1].map(function(element) {
      return element[3];
    })
	  args.unshift(head);
    return {
    	kind: "arguments",
    	args: args
    };
  }

Number "number"
  = [0-9]+("."[0-9]+)?
  {
    return {
      kind: "number",
      value: parseFloat(text()),
      location: location()
    };
  }

Boolean "boolean"
 =  ("false" / "true")
 {
 	return {
    	kind: "boolean",
      value: text() == "true",
      location: location()
    };
 }

String "string"
  = chars:StringValue
  {
    return {
      kind: "string",
      value: chars,
      location: location()
    };
  }

StringValue
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }

Identifier "identifier"
  = !Reserved IdentifierStart IdentifierPart*
  {
    return {
      location: location(),
      value: text()
    };
  }

IdentifierStart
  = [a-zA-Z_]

IdentifierPart
  = [a-zA-Z_0-9]

Reserved
  = ("var"
  / "fun"
  / "elseif"
  / "repeat"
  / "while"
  / "if"
  / "then"
  / "else"
  / "times"
  / "true"
  / "false"
  / "xor"
  / "and"
  / "or"
  / "end"
  / "return"
  / "break"
  / "continue"
  / "not"
  / "record" ) !IdentifierPart


_ "whitespace"
  = [ \t\n\r]* { return "whitespace"; }
