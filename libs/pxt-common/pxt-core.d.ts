/// <reference no-default-lib="true"/>

interface Array<T> {
    /**
      * Get or set the length of an array. This number is one more than the index of the last element the array.
      */
    //% shim=Array_::length weight=84
    //% blockId="lists_length" block="length of %VALUE" blockBuiltin=true blockNamespace="arrays"
    length: number;

    /**
      * Adiciona um novo elemento a um array.
      * @param items Novos elementos do Array.
      */
    //% help=arrays/push
    //% shim=Array_::push weight=50
    //% blockId="array_push" block="%list(lista)| adicionar valor %value| no final" blockNamespace="arrays"
    //% group="ATUALIZAR"
    push(item: T): void;

    /**
      * Concatenates the values with another array.
      * @param arr The other array that is being concatenated with
      */
    //% helper=arrayConcat weight=40
    concat(arr: T[]): T[];

    /**
      * Remova o último elemento de um array e retorne-o.
      */
    //% help=arrays/pop
    //% shim=Array_::pop weight=45
    //% blockId="array_pop" block="pegar e remover o último valor de %list(lista)" blockNamespace="arrays"
    //% group="LER"
    pop(): T;

    /**
      * Inverte os elementos de um array. O primeiro elemento do array se torna o último, e o último elemento do array se torna o primeiro.
      */
    //% help=arrays/reverse
    //% helper=arrayReverse weight=10
    //% blockId="array_reverse" block="inverter %list(lista)" blockNamespace="arrays"
    //% group="OPERAÇÕES"
    reverse(): void;

    /**
      * Remove o primeiro elemento de um array e o retorna. Este método altera o tamanho do array.
      */
    //% help=arrays/shift
    //% helper=arrayShift weight=30
    //% blockId="array_shift" block="obter e remover o primeiro valor de %list(lista)" blockNamespace="arrays"
    //% group="LER"
    shift(): T;

   
    /**
      * Adiciona um elemento ao início de um array e retorna o novo comprimento do array.
      * @param element elemento a ser inserido no início do Array.
      */
    //% help=arrays/unshift
    //% helper=arrayUnshift weight=25
    //% blockId="array_unshift" block="%list(lista)| adicionar %value| no ínicio" blockNamespace="arrays"
    //% group="ATUALIZAR"
    //unshift(...values:T[]): number; //rest is not supported in our compiler yet.
    unshift(value: T): number;

    /**
      * Return a section of an array.
      * @param start The beginning of the specified portion of the array. eg: 0
      * @param end The end of the specified portion of the array. eg: 0
      */
    //% help=arrays/slice
    //% helper=arraySlice weight=41 blockNamespace="arrays"
    slice(start?: number, end?: number): T[];

    /**
      * Remove elements from an array.
      * @param start The zero-based location in the array from which to start removing elements. eg: 0
      * @param deleteCount The number of elements to remove. eg: 0
      */
    //% helper=arraySplice weight=40
    splice(start: number, deleteCount: number): void;

    /**
      * joins all elements of an array into a string and returns this string.
      * @param sep the string separator
      */
    //% helper=arrayJoin weight=40
    join(sep?: string): string;

    /**
      * Tests whether at least one element in the array passes the test implemented by the provided function.
      * @param callbackfn A function that accepts up to two arguments. The some method calls the callbackfn function one time for each element in the array.
      */
    //% helper=arraySome weight=40
    some(callbackfn: (value: T, index: number) => boolean): boolean;

    /**
      * Tests whether all elements in the array pass the test implemented by the provided function.
      * @param callbackfn A function that accepts up to two arguments. The every method calls the callbackfn function one time for each element in the array.
      */
    //% helper=arrayEvery weight=40
    every(callbackfn: (value: T, index: number) => boolean): boolean;

    /**
      * Sort the elements of an array in place and returns the array. The sort is not necessarily stable.
      * @param specifies a function that defines the sort order. If omitted, the array is sorted according to the prmitive type
      */
    //% helper=arraySort weight=40
    sort(callbackfn?: (value1: T, value2: T) => number): T[];

    /**
      * Call a defined callback function on each element of an array, and return an array containing the results.
      * @param callbackfn A function that accepts up to two arguments. The map method calls the callbackfn function one time for each element in the array.
      */
    //% helper=arrayMap weight=40
    map<U>(callbackfn: (value: T, index: number) => U): U[];

    /**
      * Call a defined callback function on each element of an array.
      * @param callbackfn A function that accepts up to two arguments. The forEach method calls the callbackfn function one time for each element in the array.
      */
    //% helper=arrayForEach weight=40
    forEach(callbackfn: (value: T, index: number) => void): void;

    /**
      * Return the elements of an array that meet the condition specified in a callback function.
      * @param callbackfn A function that accepts up to two arguments. The filter method calls the callbackfn function one time for each element in the array.
      */
    //% helper=arrayFilter weight=40
    filter(callbackfn: (value: T, index: number) => boolean): T[];

    /**
      * Fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
      */
    //% helper=arrayFill weight=39
    fill(value: T, start?: number, end?: number): T[];

    /**
     * Returns the value of the first element in the array that satisfies the provided testing function. Otherwise undefined is returned.
     * @param callbackfn
     */
    //% helper=arrayFind weight=40
    find(callbackfn: (value: T, index: number) => boolean): T;

    /**
      * Call the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
      * @param callbackfn A function that accepts up to three arguments. The reduce method calls the callbackfn function one time for each element in the array.
      * @param initialValue Initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
      */
    //% helper=arrayReduce weight=40
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;


    /** Remove the first occurence of an object. Returns true if removed. */
    //% shim=Array_::removeElement weight=48
    removeElement(element: T): boolean;

    /** Remove e retorna o elemento em um determinado índice. */
    //% help=arrays/remove-at
    //% shim=Array_::removeAt weight=47
    //% blockId="array_removeat" block="%list(lista)| obter e remover o valor no índice %index" blockNamespace="arrays"
    //% group="LER"
    removeAt(index: number): T;

    /**
     * Insere o valor em um índice específico, aumentando o comprimento em 1.
     * @param index a posição baseada em zero na lista para inserir o valor, por exemplo: 0
     * @param value o valor a ser inserido, por exemplo: 0
     */
    //% help=arrays/insert-at
    //% shim=Array_::insertAt weight=20
    //% blockId="array_insertAt" block="%list(lista)| adicionar no índice %index| valor %value" blockNamespace="arrays"
    //% group="ATUALIZAR"
    insertAt(index: number, value: T): void;

    /**
      * Retorna o índice da primeira ocorrência de um valor em um array.
      * @param item O valor a ser localizado no array.
      * @param fromIndex O índice do array onde começar a busca. Se omitido, a busca começa no índice 0.
      */
    //% help=arrays/index-of
    //% shim=Array_::indexOf weight=40
    //% blockId="array_indexof" block="%list(lista)| encontrar índice de %value" blockNamespace="arrays"
    //% group="OPERAÇÕES"
    indexOf(item: T, fromIndex?: number): number;

    /**
     * Get the value at a particular index
     * @param index the zero-based position in the list of the item, eg: 0
     */
    //% help=arrays/get
    //% shim=Array_::getAt weight=85
    get(index: number): T;

    /**
     * Store a value at a particular index
     * @param index the zero-based position in the list to store the value, eg: 0
     * @param value the value to insert, eg: 0
     */
    //% help=arrays/set
    //% shim=Array_::setAt weight=84
    set(index: number, value: T): void;

    /**
     * Retorna um valor aleatório do array
     */
    //% help=arrays/pick-random
    //% helper=arrayPickRandom weight=25
    //% blockId="array_pickRandom" block="sorteio aleatório de %list(lista)"
    //% blockNamespace="arrays"
    //% group="LER"
    _pickRandom(): T;

    [n: number]: T;

   /**
     * Adiciona um elemento ao início de um array e retorna o novo comprimento do array.
     * @param element elemento a ser inserido no início do Array.
     */
    //% help=arrays/unshift
    //% helper=arrayUnshift weight=24
    //% blockId="array_unshift_statement" block="%list(lista)| adicionar %value| no início" blockNamespace="arrays"
    //% blockAliasFor="Array.unshift"
    //% group="ATUALIZAR"
    _unshiftStatement(value: T): void;

        /**
     * Remove o último elemento de um array e o retorna.
     */
    //% help=arrays/pop
    //% shim=Array_::pop weight=44
    //% blockId="array_pop_statement" block="remover o último valor de %list(lista)" blockNamespace="arrays"
    //% blockAliasFor="Array.pop"
    //% group="ATUALIZAR"
    _popStatement(): void;

   /**
     * Remove o primeiro elemento de um array e o retorna. Este método altera o comprimento do array.
     */
    //% help=arrays/shift
    //% helper=arrayShift weight=29
    //% blockId="array_shift_statement" block="remover o primeiro valor de %list(lista)" blockNamespace="arrays"
    //% blockAliasFor="Array.shift"
    //% group="ATUALIZAR"
    _shiftStatement(): void;

    /** Remove o elemento em um índice específico. */
    //% help=arrays/remove-at-statement
    //% shim=Array_::removeAt weight=14
    //% blockId="array_removeat_statement" block="%list(lista)| remover valor no índice %index" blockNamespace="arrays"
    //% blockAliasFor="Array.removeAt"
    //% group="ATUALIZAR"
    _removeAtStatement(index: number): void;
}

declare interface String {
    // This block is currently disabled in favor of the built-in Blockly "Create text with" block, which compiles to "" + ""
    // Add % sign back to the block annotation to re-enable
    /**
     * Returns a string that contains the concatenation of two or more strings.
     * @param other The string to append to the end of the string.
     */
    //% shim=String_::concat weight=49
    //% blockId="string_concat" blockNamespace="text"
    // block="join %list(lista)=text|%other"
    concat(other: string): string;

    /**
     * Retorna o caractere no índice especificado.
     * @param index O índice baseado em zero do caractere desejado.
     */
    //% shim=String_::charAt weight=48
    //% help=text/char-at
    //% blockId="string_get" block="caractere de %this=text|na posição %pos" blockNamespace="text"
    //% this.defl="texto"
    charAt(index: number): string;

    /** Returns the length of a String object. */
    //% property shim=String_::length weight=47
    //% blockId="text_length" block="length of %VALUE" blockBuiltin=true blockNamespace="text"
    length: number;

   /**
     * Retorna o valor Unicode do caractere na localização especificada.
     * @param index O índice baseado em zero do caractere desejado. Se não houver caractere no índice especificado, é retornado NaN.
     */
    //% shim=String_::charCodeAt weight=46
    //% help=text/char-code-at
    //% blockId="string_charcode_at" block="código do caractere de %this=text|na posição %index" blockNamespace="text"
    //% this.defl="texto"
    charCodeAt(index: number): number;

    /**
     * Compara a ordem dos caracteres em duas strings (na codificação ASCII).
     * @param that String para comparar com a string alvo
     */
    //% shim=String_::compare
    //% help=text/compare
    //% blockId="string_compare" block="comparar %this=text| com %that" blockNamespace="text"
    //% this.defl="texto"
    compare(that: string): number;

 /**
 * Retorna uma substring da string atual.
 * @param start índice do primeiro caractere; pode ser negativo para contar a partir do final, ex: 0
 * @param length número de caracteres a serem extraídos, ex: 10
 */
    //% helper=stringSubstr
    //% help=text/substr
    //% blockId="string_substr" block="sequência de caracteres de %this=text|a partir de %start|de comprimento %length" blockNamespace="text"
    //% this.defl="texto"
    substr(start: number, length?: number): string;

    /**
     * Return the current string with the first occurence of toReplace
     * replaced with the replacer
     * @param toReplace the substring to replace in the current string
     * @param replacer either the string that replaces toReplace in the current string,
     *                or a function that accepts the substring and returns the replacement string.
     */
    //% helper=stringReplace
    replace(toReplace: string, replacer: string | ((sub: string) => string)): string;

    /**
     * Return the current string with each occurence of toReplace
     * replaced with the replacer
     * @param toReplace the substring to replace in the current string
     * @param replacer either the string that replaces toReplace in the current string,
     *                or a function that accepts the substring and returns the replacement string.
     */
    //% helper=stringReplaceAll
    replaceAll(toReplace: string, replacer: string | ((sub: string) => string)): string;

    /**
     * Return a substring of the current string.
     * @param start first character index; can be negative from counting from the end, eg:0
     * @param end one-past-last character index
     */
    //% helper=stringSlice
    slice(start: number, end?: number): string;

    /** Retorna um valor indicando se a string está vazia */
    //% helper=stringEmpty
    //% help=text/is-empty
    //% blockId="string_isempty" blockNamespace="text"
    //% block="%this=text| está vazio"
    //% this.defl="texto"
    isEmpty(): boolean;

   /**
 * Retorna a posição da primeira ocorrência de um valor especificado em uma string.
 * @param searchValue o texto a ser encontrado
 * @param start índice opcional de início para a busca
 */
    //% shim=String_::indexOf
    //% help=text/index-of
    //% blockId="string_indexof" blockNamespace="text"
    //% block="%this=text|encontrar índice de %searchValue"
    //% this.defl="texto"
    indexOf(searchValue: string, start?: number): number;

   /**
     * Determina se uma string contém os caracteres de uma string especificada.
     * @param searchValue o texto a ser encontrado
     * @param start índice de início opcional para a busca
     */
    //% shim=String_::includes
    //% help=text/includes
    //% blockId="string_includes" blockNamespace="text"
    //% block="%this=text|contém %searchValue"
    //% this.defl="texto"
    includes(searchValue: string, start?: number): boolean;

  /**
     * Divide a string de acordo com os separadores.
     * @param separator
     * @param limit
     */
    //% helper=stringSplit
    //% help=text/split
    //% blockId="string_split" blockNamespace="text"
    //% block="dividir %this=text|em %separator"
    //% this.defl="texto"
    split(separator?: string, limit?: number): string[];

    /**
     * Return a substring of the current string with whitespace removed from both ends
     */
    //% helper=stringTrim
    trim(): string;

    /**
     * Converts the string to upper case characters.
     */
    //% helper=stringToUpperCase
    //% help=text/to-upper-case
    toUpperCase(): string;

    /**
     * Converts the string to lower case characters.
     */
    //% helper=stringToLowerCase
    //% help=text/to-lower-case
    toLowerCase(): string;

    [index: number]: string;
}

/**
  * Converte uma string para um número.
  * @param s Uma string para converter em número. Ex: 123
  */
//% shim=String_::toNumber
//% help=text/parse-float
//% blockId="string_parsefloat" block="transformar para número %text" blockNamespace="text"
//% text.defl="123"
declare function parseFloat(text: string): number;

/**
 * Retorna um número pseudo-aleatório entre o mínimo e o máximo inclusivo.
 * Se ambos os números forem inteiros, o resultado será inteiro.
 * @param min o limite inferior inclusivo, ex: 0
 * @param max o limite superior inclusivo, ex: 10
 */
//% blockId="device_random" block="sorteio aleatório de %min|a %limit"
//% blockNamespace="Math"
//% help=math/randint
//% shim=Math_::randomRange
declare function randint(min: number, max: number): number;

interface Object { }
interface Function {
  __assignableToFunction: Function;
}
interface IArguments {
  __assignableToIArguments: IArguments;
}
interface RegExp {
  __assignableToRegExp: RegExp;
}
type TemplateStringsArray = Array<string>;

type uint8 = number;
type uint16 = number;
type uint32 = number;
type int8 = number;
type int16 = number;
type int32 = number;


declare interface Boolean {
    /**
     * Returns a string representation of an object.
     */
    //% shim=numops::toString
    toString(): string;
}

/**
 * Combine, split, and search text strings.
*/
//% blockNamespace="text"
declare namespace String {

    /**
     * Cria uma string a partir do código do caractere ASCII fornecido.
     */
    //% help=math/from-char-code
    //% shim=String_::fromCharCode weight=1
    //% blockNamespace="text" blockId="stringFromCharCode" block="texto a partir do código do caractere %code"
    function fromCharCode(code: number): string;
}

declare interface Number {
    /**
     * Returns a string representation of a number.
     */
    //% shim=numops::toString
    toString(): string;
}

/**
 * Add, remove, and replace items in lists.
*/
//% blockNamespace="Arrays"
declare namespace Array {
    /**
     * Check if a given object is an array.
     */
    //% shim=Array_::isArray
    function isArray(obj: any): boolean;
}

declare namespace Object {
    /**
     * Return the field names in an object.
     */
    //% shim=pxtrt::keysOf
    function keys(obj: any): string[];
}

/**
 * More complex operations with numbers.
*/
declare namespace Math {
    /**
     * Returns the value of a base expression taken to a specified power.
     * @param x The base value of the expression.
     * @param y The exponent value of the expression.
     */
    //% shim=Math_::pow
    function pow(x: number, y: number): number;

    /**
     * Returns a pseudorandom number between 0 and 1.
     */
    //% shim=Math_::random
    //% help=math/random
    function random(): number;

    /**
     * Returns a pseudorandom number between min and max included.
     * If both numbers are integral, the result is integral.
     * @param min the lower inclusive bound, eg: 0
     * @param max the upper inclusive bound, eg: 10
     */
    //% blockId="device_random_deprecated" block="pick random %min|to %limit"
    //% help=math/random-range deprecated
    //% shim=Math_::randomRange
    function randomRange(min: number, max: number): number;

    /**
     * Returns the natural logarithm (base e) of a number.
     * @param x A number
     */
    //% shim=Math_::log
    //% help=math
    function log(x: number): number;

    /**
     * Returns returns ``e^x``.
     * @param x A number
     */
    //% shim=Math_::exp
    //% help=math
    function exp(x: number): number;

    /**
     * Returns the sine of a number.
     * @param x An angle in radians
     */
    //% shim=Math_::sin
    //% help=math/trigonometry
    function sin(x: number): number;

    /**
     * Returns the cosine of a number.
     * @param x An angle in radians
     */
    //% shim=Math_::cos
    //% help=math/trigonometry
    function cos(x: number): number;

    /**
     * Returns the tangent of a number.
     * @param x An angle in radians
     */
    //% shim=Math_::tan
    //% help=math/trigonometry
    function tan(x: number): number;

    /**
     * Returns the arcsine (in radians) of a number
     * @param x A number
     */
    //% shim=Math_::asin
    //% help=math/trigonometry
    function asin(x: number): number;

    /**
     * Returns the arccosine (in radians) of a number
     * @param x A number
     */
    //% shim=Math_::acos
    //% help=math/trigonometry
    function acos(x: number): number;

    /**
     * Returns the arctangent (in radians) of a number
     * @param x A number
     */
    //% shim=Math_::atan
    //% help=math/trigonometry
    function atan(x: number): number;

    /**
     * Returns the arctangent of the quotient of its arguments.
     * @param y A number
     * @param x A number
     */
    //% shim=Math_::atan2
    //% help=math/trigonometry
    function atan2(y: number, x: number): number;

    /**
     * Returns the square root of a number.
     * @param x A numeric expression.
     */
    //% shim=Math_::sqrt
    //% help=math
    function sqrt(x: number): number;

    /**
     * Returns the smallest number greater than or equal to its numeric argument.
     * @param x A numeric expression.
     */
    //% shim=Math_::ceil
      //% help=math
    function ceil(x: number): number;

    /**
      * Returns the greatest number less than or equal to its numeric argument.
      * @param x A numeric expression.
      */
    //% shim=Math_::floor
      //% help=math
    function floor(x: number): number;

    /**
      * Returns the number with the decimal part truncated.
      * @param x A numeric expression.
      */
    //% shim=Math_::trunc
    //% help=math
    function trunc(x: number): number;

    /**
      * Returns a supplied numeric expression rounded to the nearest number.
      * @param x The value to be rounded to the nearest number.
      */
    //% shim=Math_::round
    //% help=math
    function round(x: number): number;

    /**
     * Returns the value of integer signed 32 bit multiplication of two numbers.
     * @param x The first number
     * @param y The second number
     */
    //% shim=Math_::imul
    //% help=math
    function imul(x: number, y: number): number;

    /**
     * Returns the value of integer signed 32 bit division of two numbers.
     * @param x The first number
     * @param y The second number
     */
    //% shim=Math_::idiv
    //% help=math
    function idiv(x: number, y: number): number;
}

declare namespace control {
    //% shim=_control::_onCodeStart
    export function _onCodeStart(arg: any): void;

    //% shim=_control::_onCodeStop
    export function _onCodeStop(arg: any): void;
}