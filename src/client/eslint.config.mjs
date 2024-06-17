import prettier from "eslint-plugin-prettier";
import requirejs from "eslint-plugin-requirejs";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import stylisticJs from "@stylistic/eslint-plugin-js";

export default [{
	ignores: ["js/dependencies/*", "plugins/*", "ui/templates/passives/temp.js"]
}, {
	plugins: {
		prettier
		, requirejs
		, "@stylistic/js": stylisticJs
	}

	, languageOptions: {
		globals: {
			...globals.browser
			, ...globals.amd
			, $: false
			, Event: false
			, EventTarget: false
			, FormData: false
			, Map: true
			, PIXI: false
			, Promise: true
			, Set: true
			, XMLHttpRequest: false
			, _: false
			, __DEV__: true
			, __dirname: false
			, __fbBatchedBridgeConfig: false
			, alert: false
			, cancelAnimationFrame: false
			, cancelIdleCallback: false
			, clearImmediate: true
			, clearInterval: false
			, clearTimeout: false
			, console: false
			, document: false
			, escape: false
			, exports: false
			, fetch: false
			, global: false
			, isMobile: false
			, jest: false
			, module: false
			, navigator: false
			, pit: false
			, process: false
			, requestAnimationFrame: true
			, requestIdleCallback: true
			, scale: false
			, scaleMult: false
			, setImmediate: true
			, setInterval: false
			, setTimeout: false
			, window: false
		}

		, parser: babelParser
		, parserOptions: {
			requireConfigFile: false
			, babelOptions: {
				presets: ["@babel/preset-env"]
			}
		}
	}

	, rules: {
		"arrow-spacing": [2, {
			after: true
			, before: true
		}]

		, "block-scoped-var": 2
		, "brace-style": [2, "1tbs", {}]

		, camelcase: [1, {
			properties: "never"
		}]

		, "comma-dangle": [2, "never"]

		, "comma-spacing": [2, {
			before: false
			, after: true
		}]

		, curly: [2, "all"]
		, "dot-location": [2, "property"]
		, "dot-notation": 2
		, "eol-last": 2

		, eqeqeq: [2, "always", {
			null: "ignore"
		}]

		, "func-style": [1, "expression"]
		, indent: [2, "tab"]

		, "key-spacing": [2, {
			afterColon: true
		}]

		, "keyword-spacing": [2, {
			after: true
			, before: true
		}]

		, "new-parens": 2
		, "no-alert": 2
		, "no-caller": 2
		, "no-catch-shadow": 2
		, "no-cond-assign": [2, "always"]
		, "no-console": 1
		, "no-const-assign": 2
		, "no-constant-condition": 2
		, "no-control-regex": 2
		, "no-debugger": 1
		, "no-delete-var": 2
		, "no-dupe-args": 2
		, "no-dupe-keys": 2
		, "no-duplicate-case": 2
		, "no-else-return": 2

		, "no-empty": [2, {
			allowEmptyCatch: true
		}]

		, "no-empty-character-class": 2
		, "no-eq-null": 1
		, "no-eval": 2
		, "no-ex-assign": 2
		, "no-extend-native": 1
		, "no-extra-semi": 2
		, "no-fallthrough": 2
		, "no-floating-decimal": 2
		, "no-func-assign": 2
		, "no-implicit-globals": 2
		, "no-implied-eval": 2
		, "no-inline-comments": 2
		, "no-inner-declarations": [2, "functions"]
		, "no-invalid-regexp": 2
		, "no-irregular-whitespace": 2
		, "no-iterator": 2
		, "no-label-var": 2
		, "no-labels": 2
		, "no-lone-blocks": 2
		, "no-lonely-if": 2
		, "no-mixed-requires": [2, false]
		, "no-mixed-spaces-and-tabs": 2
		, "no-multi-spaces": 2

		, "no-multiple-empty-lines": [2, {
			max: 1
		}]

		, "no-native-reassign": 2
		, "no-negated-in-lhs": 2
		, "no-nested-ternary": 1
		, "no-new": 2
		, "no-new-func": 2
		, "no-new-object": 2
		, "no-new-require": 2
		, "no-new-wrappers": 2
		, "no-obj-calls": 2
		, "no-octal": 2
		, "no-octal-escape": 2
		, "no-path-concat": 2
		, "no-process-env": 1
		, "no-proto": 2
		, "no-redeclare": 2
		, "no-regex-spaces": 2
		, "no-return-assign": [2, "always"]
		, "no-script-url": 2
		, "no-self-compare": 2
		, "no-sequences": 2

		, "no-shadow": [2, {
			builtinGlobals: true
			, hoist: "all"
		}]

		, "no-shadow-restricted-names": 2
		, "no-spaced-func": 2
		, "no-sparse-arrays": 2
		, "no-throw-literal": 2
		, "no-undef": 1
		, "no-undef-init": 2
		, "no-underscore-dangle": 0
		, "no-unneeded-ternary": 2
		, "no-unreachable": 1
		, "no-unused-expressions": 2

		, "no-unused-vars": [1, {
			args: "none"
		}]

		, "no-use-before-define": 2
		, "no-useless-call": 2
		, "no-var": 2
		, "no-void": 2
		, "no-with": 2

		, "object-curly-spacing": [2, "always", {
			arraysInObjects: true
			, objectsInObjects: true
		}]

		, "padded-blocks": [2, "never"]
		, "quote-props": [2, "as-needed"]
		, quotes: [2, "double", { allowTemplateLiterals: true }]
		, "requirejs/no-commonjs-wrapper": 2
		, "requirejs/no-invalid-define": 2
		, "requirejs/no-multiple-define": 2
		, "requirejs/no-named-define": 2
		, "requirejs/no-object-define": 1
		, semi: [2, "always"]

		, "semi-spacing": [2, {
			after: true
		}]

		, "space-before-blocks": [2, "always"]
		, "space-before-function-paren": [2, "always"]
		, "space-infix-ops": 2
		, strict: [2, "global"]
		, "use-isnan": 2
		, "valid-typeof": 2
		, "wrap-iife": [2, "inside"]
		, yoda: [2, "never", {}]

		, "@stylistic/js/arrow-parens": ["error", "always"]
		, "@stylistic/js/comma-style": [ 2, "first" ]
		, "@stylistic/js/eol-last": [ 2, "always" ]
		, "@stylistic/js/no-trailing-spaces": [ 2, { skipBlankLines: false, ignoreComments: false } ]
	}
}];
