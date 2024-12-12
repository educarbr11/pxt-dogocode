/// <reference path="main.ts"/>

namespace pxt.blocks {
    const THIS_NAME = "this";

    export let showBlockIdInTooltip: boolean = false;

    // These interfaces are extended in localtypings/pxtblockly.d.ts
    export interface PxtBlockly {
    }
    export interface BlocklyModule {
    }

    // patched in webapp/pxtrunner
    export let requirePxtBlockly: () => PxtBlockly = () => undefined;
    export let requireBlockly: () => BlocklyModule = () => undefined;
    export let registerFieldEditor: (selector: string, proto: any, validator?: any) => void = () => {}

    // The JS Math functions supported in the blocks. The order of this array
    // determines the order of the dropdown in the math_js_op block
    export const MATH_FUNCTIONS = {
        unary: ["sqrt", "sin", "cos", "tan", "asin", "acos"],
        binary: ["atan2"],
        infix: ["idiv", "imul"]
    };

    // Like MATH_FUNCTIONS, but used only for rounding operations
    export const ROUNDING_FUNCTIONS = ["round", "ceil", "floor", "trunc"];

    export interface BlockParameter {
        // Declared parameter name as it appears in the code. This is the name used
        // when customizing the field in the comment attributes
        // For example: actualName.fieldEditor="gridpicker"
        actualName: string;

        // Declared parameter type as it appears in the code
        type?: string;

        // Parameter name as it appears in the block string. This is the name that
        // gets used for the input/field in the Blockly block
        definitionName: string;

        // The index of this parameter in the block string
        definitionIndex?: number;

        // Shadow block ID specified in the block string (if present)
        shadowBlockId?: string;

        // Default value for this parameter in the toolbox
        defaultValue?: string;

        // Indicates whether this field is always visible or collapsible
        isOptional?: boolean;

        // Field editor for this parameter (field is on the parent block).
        // taken from the API's comment attributes
        // For example: parameterName.fieldEditor="gridpicker"
        fieldEditor?: string;

        // Options for a field editor for this parameter (field is on the parent block)
        // taken from the API's comment attributes
        // For example: parameterName.fieldOptions.columns=5
        fieldOptions?: Map<string>;

        // Options for a field editor on a shadow block (field is on the child block)
        // taken from the API's comment attributes
        // For example: parameterName.shadowOptions.columns=5
        shadowOptions?: Map<string>;

        // The max and min for numerical inputs (if specified)
        range?: { min: number, max: number };
    }

    export interface BlockCompileInfo {
        parameters: ReadonlyArray<BlockParameter>;
        actualNameToParam: Map<BlockParameter>;
        definitionNameToParam: Map<BlockParameter>;

        handlerArgs?: HandlerArg[];
        thisParameter?: BlockParameter;
    }

    export interface HandlerArg {
        name: string,
        type: string,
        inBlockDef: boolean
    }

    // Information for blocks that compile to function calls but are defined by vanilla Blockly
    // and not dynamically by BlocklyLoader
    export const builtinFunctionInfo: pxt.Map<{ params: string[]; blockId: string; }> = {
        "Math.abs": { blockId: "math_op3", params: ["x"] },
        "Math.min": { blockId: "math_op2", params: ["x", "y"] },
        "Math.max": { blockId: "math_op2", params: ["x", "y"] }
    };

    export function normalizeBlock(b: string, err: (msg: string) => void = pxt.log): string {
        if (!b) return b;
        // normalize and validate common errors
        // made while translating
        let nb = b.replace(/(?:^|[^\\])([%$])\s+/g, '$1');
        if (nb != b) {
            err(`block has extra spaces: ${b}`);
            b = nb;
        }

        // remove spaces around %foo = ==> %foo=
        b = nb;
        nb = b.replace(/([%$]\w+)\s*=\s*(\w+)/, '$1=$2');
        if (nb != b) {
            err(`block has space between %name and = : ${b}`)
            b = nb;
        }

        // remove spaces before after pipe
        nb = nb.replace(/\s*\|\s*/g, '|');

        return nb;
    }

    export function compileInfo(fn: pxtc.SymbolInfo): BlockCompileInfo {
        const res: BlockCompileInfo = {
            parameters: [],
            actualNameToParam: {},
            definitionNameToParam: {},
            handlerArgs: []
        };

        const instance = (fn.kind == ts.pxtc.SymbolKind.Method || fn.kind == ts.pxtc.SymbolKind.Property) && !fn.attributes.defaultInstance && !fn.isStatic;
        const hasBlockDef = !!fn.attributes._def;
        const defParameters = hasBlockDef ? fn.attributes._def.parameters.slice(0) : undefined;
        const optionalStart = hasBlockDef ? defParameters.length : (fn.parameters ? fn.parameters.length : 0);
        const bInfo = builtinFunctionInfo[fn.qName];

        if (hasBlockDef && fn.attributes._expandedDef) {
            defParameters.push(...fn.attributes._expandedDef.parameters);
        }

        const refMap: Map<pxtc.BlockParameter> = {};

        const definitionsWithoutRefs = defParameters ? defParameters.filter(p => {
            if (p.ref) {
                refMap[p.name] = p;
                return false;
            }
            return true;
        }) : [];

        if (instance && hasBlockDef && defParameters.length) {
            const def = refMap[THIS_NAME] || defParameters[0];
            const defName = def.name;
            const isVar = !def.shadowBlockId || def.shadowBlockId === "variables_get";

            let defaultValue = fn.attributes.paramDefl[defName] || fn.attributes.paramDefl["this"];

            if (isVar) {
                defaultValue = def.varName || defaultValue;
            }

            res.thisParameter = {
                actualName: THIS_NAME,
                definitionName: defName,
                shadowBlockId: def.shadowBlockId,
                type: fn.namespace,
                defaultValue: defaultValue,
                definitionIndex: defParameters.indexOf(def),

                // Normally we pass ths actual parameter name, but the "this" parameter doesn't have one
                fieldEditor: fieldEditor(defName, THIS_NAME),
                fieldOptions: fieldOptions(defName, THIS_NAME),
                shadowOptions: shadowOptions(defName, THIS_NAME),
            };
        }

        if (fn.parameters) {
            let defIndex = (instance && !refMap[THIS_NAME]) ? 1 : 0;
            fn.parameters.forEach((p, i) => {
                let def: pxtc.BlockParameter;

                if (refMap[p.name]) {
                    def = refMap[p.name];
                }
                else if (defIndex < definitionsWithoutRefs.length) {
                    def = definitionsWithoutRefs[defIndex];
                    ++defIndex;
                }

                if (def || !hasBlockDef) {
                    let range: { min: number, max: number } = undefined;
                    if (p.options && p.options["min"] && p.options["max"]) {
                        range = { min: p.options["min"].value, max: p.options["max"].value };
                    }

                    const defName = def ? def.name : (bInfo ? bInfo.params[defIndex++] : p.name);
                    const isVarOrArray = def && (def.shadowBlockId === "variables_get" || def.shadowBlockId == "lists_create_with");

                    (res.parameters as BlockParameter[]).push({
                        actualName: p.name,
                        type: p.type,
                        defaultValue: isVarOrArray ? (def.varName || p.default) : p.default,
                        definitionName: defName,
                        definitionIndex: def ? defParameters.indexOf(def) : i,
                        shadowBlockId: def && def.shadowBlockId,
                        isOptional: defParameters ? defParameters.indexOf(def) >= optionalStart : false,
                        fieldEditor: fieldEditor(defName, p.name),
                        fieldOptions: fieldOptions(defName, p.name),
                        shadowOptions: shadowOptions(defName, p.name),
                        range
                    });
                }

                if (p.handlerParameters) {
                    p.handlerParameters.forEach(arg => {
                        res.handlerArgs.push({
                            name: arg.name,
                            type: arg.type,
                            inBlockDef: defParameters ? defParameters.some(def => def.ref && def.name === arg.name) : false
                        });
                    })
                }
            });
        }

        res.parameters.forEach(p => {
            res.actualNameToParam[p.actualName] = p;
            res.definitionNameToParam[p.definitionName] = p;
        });

        return res;

        function fieldEditor(defName: string, actualName: string) {
            return fn.attributes.paramFieldEditor &&
                (fn.attributes.paramFieldEditor[defName] || fn.attributes.paramFieldEditor[actualName]);
        }

        function fieldOptions(defName: string, actualName: string) {
            return fn.attributes.paramFieldEditorOptions &&
                (fn.attributes.paramFieldEditorOptions[defName] || fn.attributes.paramFieldEditorOptions[actualName]);
        }

        function shadowOptions(defName: string, actualName: string) {
            return fn.attributes.paramShadowOptions &&
                (fn.attributes.paramShadowOptions[defName] || fn.attributes.paramShadowOptions[actualName]);
        }
    }

    export function hasHandler(fn: pxtc.SymbolInfo) {
        return fn.parameters && fn.parameters.some(p => (
            p.type == "() => void" ||
            p.type == "Action" ||
            !!p.properties?.length ||
            !!p.handlerParameters?.length
        ));
    }

    export function getHelpUrl(fn: pxtc.SymbolInfo) {
        if (fn.attributes.help) {
            const helpUrl = fn.attributes.help.replace(/^\//, '');
            if (/^github:/.test(helpUrl)) {
                return helpUrl;
            } else if (helpUrl !== "none") {
                return "/reference/" + helpUrl;
            }
        } else if (fn.pkg && !pxt.appTarget.bundledpkgs[fn.pkg]) {// added package
            let anchor = fn.qName.toLowerCase().split('.');
            if (anchor[0] == fn.pkg) anchor.shift();
            return `/pkg/${fn.pkg}#${encodeURIComponent(anchor.join('-'))}`;
        }

        return undefined;
    }

    /**
     * Returns which Blockly block type to use for an argument reporter based
     * on the specified TypeScript type.
     * @param varType The variable's TypeScript type
     * @return The Blockly block type of the reporter to be used
     */
    export function reporterTypeForArgType(varType: string) {
        let reporterType = "argument_reporter_custom";

        if (varType === "boolean" || varType === "number" || varType === "string") {
            reporterType = `argument_reporter_${varType}`;
        }

        if (/^(?:Array<(?:.+)>)|(?:(?:.+)\[\])$/.test(varType)) {
            reporterType = "argument_reporter_array";
        }

        return reporterType;
    }

    export function defaultIconForArgType(typeName: string = "") {
        switch (typeName) {
            case "number":
                return "calculator";
            case "string":
                return "text width";
            case "boolean":
                return "random";
            case "Array":
                return "list";
            default:
                return "align justify"
        }
    }

    export interface FieldDescription {
        n: string;
        pre?: string;
        p?: string;
        ni: number;
    }

    export function parseFields(b: string): FieldDescription[] {
        // normalize and validate common errors
        // made while translating
        return b.split('|').map((n, ni) => {
            let m = /([^%]*)\s*%([a-zA-Z0-9_]+)/.exec(n);
            if (!m) return { n, ni };

            let pre = m[1]; if (pre) pre = pre.trim();
            let p = m[2];
            return { n, ni, pre, p };
        });
    }

    export interface BlockDefinition {
        name: string;
        category: string;
        url: string;
        tooltip?: string | Map<string>;
        operators?: Map<string[]>;
        block?: Map<string>;
        blockTextSearch?: string; // Which block text to use for searching; if undefined, search uses all texts in BlockDefinition.block, joined with space
        tooltipSearch?: string; // Which tooltip to use for searching; if undefined, search uses all tooltips in BlockDefinition.tooltip, joined with space
        translationIds?: string[];
    }

    let _blockDefinitions: Map<BlockDefinition>;
    export function blockDefinitions(): Map<BlockDefinition> {
        if (!_blockDefinitions) cacheBlockDefinitions();
        return _blockDefinitions;
    }

    export function getBlockDefinition(blockId: string): BlockDefinition {
        if (!_blockDefinitions) cacheBlockDefinitions();
        return _blockDefinitions[blockId];
    }

    // Resources for built-in and extra blocks
    function cacheBlockDefinitions(): void {
        _blockDefinitions = {
            'device_while': {
                name: Util.lf("a loop that repeats while the condition is true"),
                tooltip: Util.lf("Execute a mesma sequência de ações enquanto a condição for atendida."),
                url: '/blocks/loops/while',
                category: 'loops',
                block: {
                    message0: Util.lf("enquanto %1"),
                    appendField: Util.lf("{id:while}faça")
                }
            },
            'pxt_controls_for': {
                name: Util.lf("a loop that repeats the number of times you say"),
                tooltip: Util.lf("Faça com que a variável '{0}' assuma os valores de 0 até o número final, contando por 1, e faça os blocos especificados."), // The name of the iteration variable that goes in {0} is replaced in blocklyloader
                url: '/blocks/loops/for',
                category: 'loops',
                block: {
                    message0: Util.lf("para %1 de 0 a %2"),
                    variable: Util.lf("{id:var}índice"),
                    appendField: Util.lf("{id:for}faça")
                }
            },
            'controls_simple_for': {
                name: Util.lf("a loop that repeats the number of times you say"),
                tooltip: Util.lf("Faça com que a variável '{0}' assuma os valores de 0 até o número final, contando por 1, e faça os blocos especificados."), // The name of the iteration variable that goes in {0} is replaced in blocklyloader
                url: '/blocks/loops/for',
                category: 'loops',
                block: {
                    message0: Util.lf("para %1 de 0 a %2"),
                    variable: Util.lf("{id:var}índice"),
                    appendField: Util.lf("{id:for}faça")
                }
            },
            'pxt_controls_for_of': {
                name: Util.lf("a loop that repeats for each value in an array"),
                tooltip: Util.lf("Faça com que a variável '{0}' pegue o valor de cada item do array, um por um, e faça os blocos especificados."), // The name of the iteration variable that goes in {0} is replaced in blocklyloader
                url: '/blocks/loops/for-of',
                category: 'loops',
                block: {
                    message0: Util.lf("para elemento %1 de %2"),
                    variable: Util.lf("{id:var}value"),
                    appendField: Util.lf("{id:for_of}fazer")
                }
            },
            'controls_for_of': {
                name: Util.lf("a loop that repeats for each value in an array"),
                tooltip: Util.lf("Faça com que a variável '{0}' pegue o valor de cada item do array, um por um, e faça os blocos especificados."), // The name of the iteration variable that goes in {0} is replaced in blocklyloader
                url: '/blocks/loops/for-of',
                category: 'loops',
                block: {
                    message0: Util.lf("para elemento %1 de %2"),
                    variable: Util.lf("{id:var}valor"),
                    appendField: Util.lf("{id:for_of}fazer")
                }
            },
            'math_op2': {
                name: Util.lf("mínimo ou máximo de 2 números"),
                tooltip: {
                    "min": Util.lf("valor menor de 2 números"),
                    "max": Util.lf("valor maior de 2 números")
                },
                url: '/blocks/math',
                operators: {
                    'op': ["min", "max"]
                },
                category: 'math',
                block:{
                    message0: Util.lf("[%1] de %2 e %3")
                }
            },
            'math_op3': {
                name: Util.lf("número absoluto"),
                tooltip: Util.lf("valor absoluto de um número"),
                url: '/reference/math',
                category: 'math',
                block: {
                    message0: Util.lf("absoluto de %1")
                }
            },
            'math_number': {
                name: Util.lf("{id:block}número"),
                url: '/types/number',
                category: 'math',
                tooltip: (pxt.appTarget && pxt.appTarget.compile) ?
                    Util.lf("um número decimal") : Util.lf("um número inteiro")
            },
            'math_integer': {
                name: Util.lf("{id:block}número"),
                url: '/types/number',
                category: 'math',
                tooltip: Util.lf("um número inteiro")
            },
            'math_whole_number': {
                name: Util.lf("{id:block}número"),
                url: '/types/number',
                category: 'math',
                tooltip: Util.lf("um número inteiro positivo")
            },
            'math_number_minmax': {
                name: Util.lf("{id:block}número"),
                url: '/blocks/math',
                category: 'math'
            },
            'math_arithmetic': {
                name: Util.lf("operação aritmética"),
                url: '/blocks/math',
                tooltip: {
                    ADD: Util.lf("Retorne a soma dos dois números."),
                    MINUS: Util.lf("Retorne a diferença entre os dois números."),
                    MULTIPLY: Util.lf("Retorne o produto dos dois números."),
                    DIVIDE: Util.lf("Retorne o quociente dos dois números."),
                    POWER: Util.lf("Retorne o primeiro número elevado à potência do segundo número."),
                },
                operators: {
                    'OP': ["ADD", "MINUS", "MULTIPLY", "DIVIDE", "POWER"]
                },
                category: 'math',
                block: {
                    MATH_ADDITION_SYMBOL: Util.lf("{id:op}+"),
                    MATH_SUBTRACTION_SYMBOL: Util.lf("{id:op}-"),
                    MATH_MULTIPLICATION_SYMBOL: Util.lf("{id:op}×"),
                    MATH_DIVISION_SYMBOL: Util.lf("{id:op}/"),
                    MATH_POWER_SYMBOL: Util.lf("{id:op}**")
                }
            }
            ,
         'math_modulo': {
            name: Util.lf("resto da divisão"),
            tooltip: Util.lf("Retorne o resto da divisão dos dois números."),
            url: '/blocks/math',
            category: 'math',
            block: {
                MATH_MODULO_TITLE: Util.lf("resto de %1 / %2")
            }
        },
        'math_js_op': {
            name: Util.lf("função matemática"),
            tooltip: {
                "sqrt": Util.lf("Retorna a raiz quadrada do argumento"),
                "sin": Util.lf("Retorna o seno do argumento"),
                "cos": Util.lf("Retorna o cosseno do argumento"),
                "acos": Util.lf("Retorna o arco cosseno do argumento"),
                "asine": Util.lf("Retorna o arco seno do argumento"),
                "tan": Util.lf("Retorna a tangente do argumento"),
                "atan2": Util.lf("Retorna o arco tangente do quociente dos dois argumentos"),
                "idiv": Util.lf("Retorna a porção inteira da operação de divisão dos dois argumentos"),
                "imul": Util.lf("Retorna a porção inteira da operação de multiplicação dos dois argumentos")
            },
            url: '/blocks/math',
            operators: {
                'OP': ["sqrt", "sin", "cos", "tan", "atan2", "idiv", "imul"]
            },
            category: 'math',
            block: {
                "sqrt": Util.lf("{id:op}raiz quadrada"),
                "sin": Util.lf("{id:op}seno"),
                "cos": Util.lf("{id:op}cosseno"),
                "asin": Util.lf("{id:op}arco seno"),
                "acos": Util.lf("{id:op}arco cosseno"),
                "tan": Util.lf("{id:op}tangente"),
                "atan2": Util.lf("{id:op}arco tangente"),
                "idiv": Util.lf("{id:op}divisão inteira /"),
                "imul": Util.lf("{id:op}multiplicação inteira ×"),
            }
        },
        "math_js_round": {
            name: Util.lf("funções de arredondamento"),
            tooltip: {
                "round": Util.lf("Aumenta o argumento para o próximo número inteiro se sua parte fracionária for maior que um meio"),
                "ceil": Util.lf("Aumenta o argumento para o próximo número inteiro"),
                "floor": Util.lf("Diminui o argumento para o próximo número inteiro inferior"),
                "trunc": Util.lf("Remove a parte fracionária do argumento")
            },
            url: '/blocks/math',
            operators: {
                "OP": ["round", "ceil", "floor", "trunc"]
            },
            category: 'math',
            block: {
                "round": Util.lf("{id:op}arredondar"),
                "ceil": Util.lf("{id:op}arredondar para cima"),
                "floor": Util.lf("{id:op}arredondar para baixo"),
                "trunc": Util.lf("{id:op}truncar"),
            }
        },
            'variables_change': {
                name: Util.lf("update the value of a number variable"),
                tooltip: Util.lf("Altera o valor da variável por este valor"),
                url: '/blocks/variables/change',
                category: 'variables',
                block: {
                    message0: Util.lf("mudar %1 por %2")
                }
            },
            'controls_repeat_ext': {
                name: Util.lf("a loop that repeats and increments an index"),
                tooltip: Util.lf("Execute algumas instruções várias vezes."),
                url: '/blocks/loops/repeat',
                category: 'loops',
                block: {
                    CONTROLS_REPEAT_TITLE: Util.lf("repete %1 vezes"),
                    CONTROLS_REPEAT_INPUT_DO: Util.lf("{id:repeat}faça")
                }
            },
            'variables_get': {
                name: Util.lf("get the value of a variable"),
                tooltip: Util.lf("Retorna o valor desta variável."),
                url: '/blocks/variables',
                category: 'variables',
                block: {
                    VARIABLES_GET_CREATE_SET: Util.lf("Create 'set %1'")
                }
            },
            'variables_get_reporter': {
                name: Util.lf("get the value of a variable"),
                tooltip: Util.lf("Returns the value of this variable."),
                url: '/blocks/variables',
                category: 'variables',
                block: {
                    VARIABLES_GET_CREATE_SET: Util.lf("Create 'set %1'")
                }
            },
            'variables_set': {
                name: Util.lf("assign the value of a variable"),
                tooltip: Util.lf("Define esta variável para ser igual à entrada."),
                url: '/blocks/variables/assign',
                category: 'variables',
                block: {
                    VARIABLES_SET: Util.lf("definir %1 para %2")
                }
            },
            'controls_if': {
                name: Util.lf("a conditional statement"),
                tooltip: {
                    CONTROLS_IF_TOOLTIP_1: Util.lf("Se um valor for verdadeiro, execute algumas instruções."),
                    CONTROLS_IF_TOOLTIP_2: Util.lf("Se um valor for verdadeiro, execute o primeiro bloco de instruções. Caso contrário, execute o segundo bloco de instruções."),
                    CONTROLS_IF_TOOLTIP_3: Util.lf("Se o primeiro valor for verdadeiro, execute o primeiro bloco de instruções. Caso contrário, se o segundo valor for verdadeiro, execute o segundo bloco de instruções."),
                    CONTROLS_IF_TOOLTIP_4: Util.lf("Se o primeiro valor for verdadeiro, execute o primeiro bloco de instruções. Caso contrário, se o segundo valor for verdadeiro, execute o segundo bloco de instruções. Se nenhum dos valores for verdadeiro, execute o último bloco de instruções.")
                },
                tooltipSearch: "CONTROLS_IF_TOOLTIP_2",
                url: '/blocks/logic/if',
                category: 'logic',
                block: {
                    CONTROLS_IF_MSG_IF: Util.lf("{id:logic}se"),
                    CONTROLS_IF_MSG_THEN: Util.lf("{id:logic}então"),
                    CONTROLS_IF_MSG_ELSE: Util.lf("{id:logic}senão"),
                    CONTROLS_IF_MSG_ELSEIF: Util.lf("{id:logic}senão se")
                }
            },
          'lists_create_with': {
                name: Util.lf("criar um array"),
                tooltip: Util.lf("Cria um novo array."),
                url: '/reference/arrays/create',
                category: 'arrays',
                blockTextSearch: "LISTS_CREATE_WITH_INPUT_WITH",
                block: {
                    LISTS_CREATE_EMPTY_TITLE: Util.lf("array vazio"),
                    LISTS_CREATE_WITH_INPUT_WITH: Util.lf("array de"),
                    LISTS_CREATE_WITH_CONTAINER_TITLE_ADD: Util.lf("array"),
                    LISTS_CREATE_WITH_ITEM_TITLE: Util.lf("valor")
                }
            },
            'lists_length': {
                name: Util.lf("tamanho do array"),
                tooltip: Util.lf("Retorna o número de itens em um array."),
                url: '/reference/arrays/length',
                category: 'arrays',
                block: {
                    LISTS_LENGTH_TITLE: Util.lf("tamanho do array %1")
                }
            },
            'lists_index_get': {
                name: Util.lf("obter um valor em um array"),
                tooltip: Util.lf("Retorna o valor no índice dado em um array."),
                url: '/reference/arrays/get',
                category: 'arrays',
                block: {
                    message0: Util.lf("%1 obter valor em %2")
                }
            },
            'lists_index_set': {
                name: Util.lf("definir um valor em um array"),
                tooltip: Util.lf("Define o valor no índice dado em um array"),
                url: '/reference/arrays/set',
                category: 'arrays',
                block: {
                    message0: Util.lf("%1 definir valor em %2 para %3")
                }
            },

            'logic_compare': {
                name: Util.lf("comparing two numbers"),
                tooltip: {
                    LOGIC_COMPARE_TOOLTIP_EQ: Util.lf("Retorne verdadeiro se ambas as entradas forem iguais."),
                    LOGIC_COMPARE_TOOLTIP_NEQ: Util.lf("Retorne verdadeiro se ambas as entradas não forem iguais."),
                    LOGIC_COMPARE_TOOLTIP_LT: Util.lf("Retorne verdadeiro se a primeira entrada for menor que a segunda entrada."),
                    LOGIC_COMPARE_TOOLTIP_LTE: Util.lf("Retorne verdadeiro se a primeira entrada for menor ou igual à segunda entrada."),
                    LOGIC_COMPARE_TOOLTIP_GT: Util.lf("Retorne verdadeiro se a primeira entrada for maior que a segunda entrada."),
                    LOGIC_COMPARE_TOOLTIP_GTE: Util.lf("Retorne verdadeiro se a primeira entrada for maior ou igual à segunda entrada.")
                },
                url: '/blocks/logic/boolean',
                category: 'logic',
                block: {
                    search: "= ≠ < ≤ > ≥" // Only used for search; this string is not surfaced in the block's text
                }
            },
            'logic_operation': {
                name: Util.lf("boolean operation"),
                tooltip: {
                    LOGIC_OPERATION_TOOLTIP_AND: Util.lf("Retorne verdadeiro se ambas as entradas forem verdadeiras."),
                    LOGIC_OPERATION_TOOLTIP_OR: Util.lf("Retorne verdadeiro se pelo menos uma das entradas for verdadeira.")
                },
                url: '/blocks/logic/boolean',
                category: 'logic',
                block: {
                    LOGIC_OPERATION_AND: Util.lf("{id:op}e"),
                    LOGIC_OPERATION_OR: Util.lf("{id:op}ou")
                }
            },
            'logic_negate': {
                name: Util.lf("logical negation"),
                tooltip: Util.lf("Retorne verdadeiro se a entrada for falsa. Retorne falso se a entrada for verdadeira."),
                url: '/blocks/logic/boolean',
                category: 'logic',
                block: {
                    LOGIC_NEGATE_TITLE: Util.lf("o oposto de %1")
                }
            },
            'logic_boolean': {
                name: Util.lf("a `true` or `false` value"),
                tooltip: Util.lf("Retorna verdadeiro ou falso."),
                url: '/blocks/logic/boolean',
                category: 'logic',
                block: {
                    LOGIC_BOOLEAN_TRUE: Util.lf("{id:boolean}verdadeiro"),
                    LOGIC_BOOLEAN_FALSE: Util.lf("{id:boolean}falso")
                }
            },
            'text': {
                name: Util.lf("um pedaço de texto"),
                tooltip: Util.lf("Uma letra, palavra ou linha de texto."),
                url: '/types/string',
                category: 'text',
                block: {
                    search: Util.lf("um pedaço de texto") // Apenas usado para busca; essa string não aparece no texto do bloco
                }
            },
            'text_length': {
                name: Util.lf("número de caracteres na string"),
                tooltip: Util.lf("Retorna o número de letras (incluindo espaços) no texto fornecido."),
                url: '/reference/text/length',
                category: 'text',
                block: {
                    TEXT_LENGTH_TITLE: Util.lf("comprimento de %1")
                }
            },
            'text_join': {
                name: Util.lf("juntar itens para criar texto"),
                tooltip: Util.lf("Crie um pedaço de texto juntando qualquer número de itens."),
                url: '/reference/text/join',
                category: 'text',
                block: {
                    TEXT_JOIN_TITLE_CREATEWITH: Util.lf("juntar")
                }
            },
            'procedures_defnoreturn': {
                name: Util.lf("definir a função"),
                tooltip: Util.lf("Crie uma função."),
                url: '/types/function/define',
                category: 'functions',
                block: {
                    PROCEDURES_DEFNORETURN_TITLE: Util.lf("função"),
                    PROCEDURE_ALREADY_EXISTS: Util.lf("Já existe uma função chamada '%1'.")
                }
            },
            'procedures_callnoreturn': {
                name: Util.lf("chamar a função"),
                tooltip: Util.lf("Chame a função definida pelo usuário."),
                url: '/types/function/call',
                category: 'functions',
                block: {
                    PROCEDURES_CALLNORETURN_TITLE: Util.lf("chamar função")
                }
            },
            'function_return': {
                name: Util.lf("retornar um valor de dentro de uma função"),
                tooltip: Util.lf("Retorne um valor de dentro de uma função definida pelo usuário."),
                url: '/types/function/return',
                category: 'functions',
                block: {
                    message_with_value: Util.lf("retornar %1"),
                    message_no_value: Util.lf("retornar")
                }
            },
            'function_definition': {
                name: Util.lf("definir a função"),
                tooltip: Util.lf("Crie uma função."),
                url: '/types/function/define',
                category: 'functions',
                block: {
                    FUNCTIONS_EDIT_OPTION: Util.lf("Editar Função")
                }
            },
            'function_call': {
                name: Util.lf("chamar a função"),
                tooltip: Util.lf("Chame a função definida pelo usuário."),
                url: '/types/function/call',
                category: 'functions',
                block: {
                    FUNCTIONS_CALL_TITLE: Util.lf("chamar"),
                    FUNCTIONS_GO_TO_DEFINITION_OPTION: Util.lf("Ir para Definição")
                }
            },
            'function_call_output': {
                name: Util.lf("chamar a função com um valor de retorno"),
                tooltip: Util.lf("Chame a função definida pelo usuário com um valor de retorno."),
                url: '/types/function/call',
                category: 'functions',
                block: {
                }
            },

        };
        _blockDefinitions[pxtc.ON_START_TYPE] = {
            name: Util.lf("on start event"),
            tooltip: Util.lf("Rodar código quando o programa iniciar"),
            url: '/blocks/on-start',
            category: "loops", // The real category is overriden by apptarget in blocklyloader.ts
            block: {
                message0: Util.lf("ao iniciar faça %1 %2")
            }
        };
        _blockDefinitions[pxtc.PAUSE_UNTIL_TYPE] = {
            name: Util.lf("pause until"),
            tooltip: Util.lf("Pause execution of code until the given boolean expression is true"),
            url: '/blocks/pause-until',
            category: "loops", // The real category is overriden by apptarget in blocklyloader.ts
            block: {
                message0: Util.lf("pause until %1")
            }
        };
        _blockDefinitions[pxtc.TS_BREAK_TYPE] = {
            name: Util.lf("break"),
            tooltip: Util.lf("Parar o programa atual ou alternar"),
            url: '/blocks/loops/break',
            category: 'loops',
            block: {
                message0: Util.lf("parar")
            }
        }
        _blockDefinitions[pxtc.TS_CONTINUE_TYPE] = {
            name: Util.lf("continue"),
            tooltip: Util.lf("Pula a iteração atual e continua com a próxima iteração no loop."),
            url: '/blocks/loops/continue',
            category: 'loops',
            block: {
                message0: Util.lf("continuar")
            }
        }

        if (pxt.blocks.showBlockIdInTooltip) {
            for (const id of Object.keys(_blockDefinitions)) {
                const tooltip = _blockDefinitions[id].tooltip;
                if (typeof tooltip === "object" && tooltip !== null) {
                    for (const innerKey in tooltip) {
                        if (tooltip.hasOwnProperty(innerKey)) {
                            (_blockDefinitions[id].tooltip as any)[innerKey] = `${tooltip[innerKey]} (id: ${id})`;
                        }
                    }
                } else {
                    _blockDefinitions[id].tooltip = `${_blockDefinitions[id].tooltip} (id: ${id})`;
                }
            }
        }
    }

    export async function initInContextTranslationAsync() {
        if (!_blockDefinitions) cacheBlockDefinitions();

        const msg: pxt.Map<string> = {}
        await Promise.all(
            Util.values(_blockDefinitions).filter(b => b.block).map(async b => {
                const keys = Object.keys(b.block);
                b.translationIds = Util.values(b.block);
                await Promise.all(
                    keys.map(async k => {
                        const r = await pxt.crowdin.inContextLoadAsync(b.block[k])
                        b.block[k] = r;
                        // override builtin blockly namespace strings
                        if (/^[A-Z_]+$/.test(k)) {
                            msg[k] = r;
                        }
                    })
                );
            })
        );

        return msg;
    }
}
