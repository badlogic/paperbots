// PEG grammar for a minimal programming language

Program
  = stmts:(_ (Statement / Function) _)*
  {
    return stmts.map(function(element) {
      return element[1];
    });
  }

Function "function"
  = "fun" _ id:Identifier _ "(" params:Parameters ")" _ returnType:(":" _ Identifier _)? _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "function",
      name: id,
      params: params,
      returnTypeName: returnType != null ? returnType[2] : null,
      statements: stmts.map(function(element) { return element[1]; })
    };
  }

Parameter
  = name:Identifier _ ":" _ typeName:Identifier
  {
    return {
      kind: "parameter",
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

Statement
  = Variable
  / Assignment
  / Repeat
  / While
  / If
  / Expression

Variable
  = "var" _ id:Identifier _ (":" _ typeName:Identifier _)? "=" _ init: Expression
  {
    return {
      kind: "variable",
      name: id,
      typeName: typeof typeName === undefined ? typeName : null,
      init: init
    };
  }

Assignment
  = id:Identifier _ "=" _ value:Expression
  {
    return {
      kind: "assignment",
      variableName: id,
      value: value
    };
  }

Repeat
  = "repeat" _ count:Expression _ "times" _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "repeat",
      count: count,
      statements: stmts.map(function(element) { return element[1]; })
    };
  }

While
  = "while" _ cond:Expression _ "do" _ stmts:(_ Statement _)* _ "end"
  {
    return {
      kind: "while",
      condition: cond,
      statements: stmts.map(function(element) { return element[1]; })
    };
  }

If
  = "if" _ Expression _ "then" _ (Statement)* _ ("elseif" _ Expression _ "then" _ (Statement)*)* ("else" _ (Statement)*)? _ "end"

Expression
  = head:Term tail:(_ ("+" / "-") _ Term)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3]
        }
    }, head);
  }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)*
  {
    if (tail.length == 0) return head;

  	return tail.reduce(function(result, element) {
    	return {
          kind: "binaryOp",
          operator: element[1],
          left: result,
          right: element[3]
        }
    }, head);
  }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Number
  / String
  / CallOrIdentifier

CallOrIdentifier "function call or variable name"
  = id:Identifier args:(Arguments)?
  {
  	if (args === null) return { kind: "variableAccess", name: id };
    return {
      kind: "functionCall",
      name: id,
      args: args
    };
  }

Arguments "arguments"
  = "(" _ args:(Expression ( _ "," _ Expression )* ) ? _ ")"
  {
    if (args == null) return [];
    var head = args[0];
    args = args[1].map(function(element) {
      return element[3];
    })
	args.unshift(head);
    return args;
  }

Number "number"
  = [0-9]+("."[0-9]+)?
  {
    return {
      kind: "number",
      value: parseFloat(text(), 10)
    };
  }

String "string"
  = '"' chars:StringCharacter* '"'
  {
    return {
      kind: "string",
      value: JSON.stringify(chars.join(""))
    };
  }

StringCharacter
  = '\\' '"' { return '"'; }
  / !'"' . { return text(); }

Identifier "identifier"
  = !Reserved [a-zA-Z_]+
  {
    return {
      kind: "identifier",
      value: text()
    };
  }

Reserved
  = "var"
  / "fun"
  / "end"
  / "repeat"
  / "while"
  / "if"
  / "then"
  / "else"
  / "elseif"
  / "times"

_ "whitespace"
  = [ \t\n\r]* { return "whitespace"; }
