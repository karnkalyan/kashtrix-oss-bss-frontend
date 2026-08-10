const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")

test("inactive license gate cannot be dismissed and provides recovery actions", () => {
  const source = read("components/license-expired-modal.tsx")

  assert.match(source, /hideCloseButton/)
  assert.match(source, /Boolean\(user\) && !isLicenseGeneratorPage && gateState !== "active"/)
  assert.match(source, /isLicenseGeneratorPage/)
  assert.match(source, /info@kashtrix\.com/)
  assert.match(source, /https:\/\/kashtrix\.com/)
  assert.match(source, /onEscapeKeyDown=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(source, /onPointerDownOutside=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(source, /onInteractOutside=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(source, /Install and activate license/)
  assert.match(source, /Recheck license/)
  assert.doesNotMatch(source, />\s*Close\s*</)
})

test("shared dialog supports hiding its close control", () => {
  const source = read("components/ui/dialog.tsx")
  assert.match(source, /hideCloseButton\?: boolean/)
  assert.match(source, /!hideCloseButton/)
})
