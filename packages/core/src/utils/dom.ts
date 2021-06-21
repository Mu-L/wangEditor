/**
 * @description DOM 操作 part1 - DOM7 文档 https://framework7.io/docs/dom7.html
 * @author wangfupeng
 */

import { htmlVoidElements } from 'html-void-elements'
import {
  $,
  css,
  append,
  addClass,
  removeClass,
  hasClass,
  on,
  focus,
  attr,
  hide,
  show,
  scrollTop,
  offset,
  width,
  height,
  parents,
  is,
  dataset,
  val,
  text,
  removeAttr,
  children,
  html,
  remove,
  find,
  each,
} from 'dom7'
export { Dom7Array } from 'dom7'

$.fn.css = css
$.fn.append = append
$.fn.addClass = addClass
$.fn.removeClass = removeClass
$.fn.hasClass = hasClass
$.fn.on = on
$.fn.focus = focus
$.fn.attr = attr
$.fn.removeAttr = removeAttr
$.fn.hide = hide
$.fn.show = show
$.fn.scrollTop = scrollTop
$.fn.offset = offset
$.fn.width = width
$.fn.height = height
$.fn.parents = parents
$.fn.is = is
$.fn.dataset = dataset
$.fn.val = val
$.fn.text = text
$.fn.html = html
$.fn.children = children
$.fn.remove = remove
$.fn.find = find
$.fn.each = each

export default $

// ------------------------------- 分割线，以下内容参考 slate-react dom.ts -------------------------------

// COMPAT: This is required to prevent TypeScript aliases from doing some very
// weird things for Slate's types with the same name as globals. (2019/11/27)
// https://github.com/microsoft/TypeScript/issues/35002
import DOMNode = globalThis.Node
import DOMComment = globalThis.Comment
import DOMElement = globalThis.Element
import DOMText = globalThis.Text
import DOMRange = globalThis.Range
import DOMSelection = globalThis.Selection
import DOMStaticRange = globalThis.StaticRange
export { DOMNode, DOMComment, DOMElement, DOMText, DOMRange, DOMSelection, DOMStaticRange }

export type DOMPoint = [Node, number]

/**
 * Check if a DOM node is a comment node.
 */
export const isDOMComment = (value: any): value is DOMComment => {
  return isDOMNode(value) && value.nodeType === 8
}

/**
 * Check if a DOM node is an element node.
 */
export const isDOMElement = (value: any): value is DOMElement => {
  return isDOMNode(value) && value.nodeType === 1
}

/**
 * Check if a value is a DOM node.
 */
export const isDOMNode = (value: any): value is DOMNode => {
  return value instanceof Node
}

/**
 * Check if a DOM node is an element node.
 */
export const isDOMText = (value: any): value is DOMText => {
  return isDOMNode(value) && value.nodeType === 3
}

/**
 * Checks whether a paste event is a plaintext-only event.
 */
export const isPlainTextOnlyPaste = (event: ClipboardEvent) => {
  return (
    event.clipboardData &&
    event.clipboardData.getData('text/plain') !== '' &&
    event.clipboardData.types.length === 1
  )
}

/**
 * Normalize a DOM point so that it always refers to a text node.
 */
export const normalizeDOMPoint = (domPoint: DOMPoint): DOMPoint => {
  let [node, offset] = domPoint

  // If it's an element node, its offset refers to the index of its children
  // including comment nodes, so try to find the right text child node.
  if (isDOMElement(node) && node.childNodes.length) {
    const isLast = offset === node.childNodes.length
    const direction = isLast ? 'backward' : 'forward'
    const index = isLast ? offset - 1 : offset
    node = getEditableChild(node, index, direction)

    // If the node has children, traverse until we have a leaf node. Leaf nodes
    // can be either text nodes, or other void DOM nodes.
    while (isDOMElement(node) && node.childNodes.length) {
      const i = isLast ? node.childNodes.length - 1 : 0
      node = getEditableChild(node, i, direction)
    }

    // Determine the new offset inside the text node.
    offset = isLast && node.textContent != null ? node.textContent.length : 0
  }

  // Return the node and offset.
  return [node, offset]
}

/**
 * Get the nearest editable child at `index` in a `parent`, preferring `direction`.
 */
export const getEditableChild = (
  parent: DOMElement,
  index: number,
  direction: 'forward' | 'backward'
): DOMNode => {
  const { childNodes } = parent
  let child = childNodes[index]
  let i = index
  let triedForward = false
  let triedBackward = false

  // While the child is a comment node, or an element node with no children,
  // keep iterating to find a sibling non-void, non-comment node.
  while (
    isDOMComment(child) ||
    (isDOMElement(child) && child.childNodes.length === 0) ||
    (isDOMElement(child) && child.getAttribute('contenteditable') === 'false')
  ) {
    if (triedForward && triedBackward) {
      break
    }

    if (i >= childNodes.length) {
      triedForward = true
      i = index - 1
      direction = 'backward'
      continue
    }

    if (i < 0) {
      triedBackward = true
      i = index + 1
      direction = 'forward'
      continue
    }

    child = childNodes[i]
    i += direction === 'forward' ? 1 : -1
  }

  return child
}

/**
 * Get a plaintext representation of the content of a node, accounting for block
 * elements which get a newline appended.
 *
 * The domNode must be attached to the DOM.
 */
export const getPlainText = (domNode: DOMNode) => {
  let text = ''

  if (isDOMText(domNode) && domNode.nodeValue) {
    return domNode.nodeValue
  }

  if (isDOMElement(domNode)) {
    for (const childNode of Array.from(domNode.childNodes)) {
      text += getPlainText(childNode)
    }

    const display = getComputedStyle(domNode).getPropertyValue('display')

    if (display === 'block' || display === 'list' || domNode.tagName === 'BR') {
      text += '\n'
    }
  }

  return text
}

/**
 * 从 elem.children 中找到 void elem
 * @param elem elem
 */
export function getVoidChild(elem: DOMElement): DOMElement | null {
  const children = elem.children
  const length = children.length
  for (let i = 0; i < length; i++) {
    const child = children[i]
    const { nodeName, nodeType } = child
    if (nodeType === 1) {
      const name = nodeName.toLowerCase()
      if (htmlVoidElements.includes(name)) {
        // 是 void node ，如 image
        return child
      }
    }
  }
  return null
}