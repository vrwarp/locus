import '@testing-library/jest-dom';

window.HTMLElement.prototype.scrollIntoView = function() {};

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function() {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function() {};
}
