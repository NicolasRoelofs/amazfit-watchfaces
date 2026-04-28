import { TEXT_CHAR_HEIGHT, TEXT_CHAR_WIDTH, TEXT_CHARS } from './chars';
import { calculateAnglularLength } from './utils';

/**
 * Circle text, where every char is hmUI.widget.IMG widget
 * - center of text rotation is the center of the screen of w480 size
 * @param {Object} params
 */
export class CircleTextWidget {
  constructor({ maxLength, text, angleStart, radius, gap, isTextReversed, kerningPairs = {} }) {
    this._charImages = TEXT_CHARS;
    this._imageWidth = TEXT_CHAR_WIDTH;
    this._imageHeight = TEXT_CHAR_HEIGHT;
    this._screenSize = px(480);
    this._maxLength = maxLength;
    this._kerningPairs = kerningPairs;

    this._angleStart = angleStart;
    this._radius = radius;
    this._gap = gap;
    this._isTextReversed = isTextReversed;

    this._chars = this._normalizeText(text);

    this._widgets = this._createWidgets();
  }

  _normalizeText(text) {
    return text
      .toLowerCase()
      .slice(0, this._maxLength)
      .padEnd(this._maxLength, ' ')
      .split('');
  }

  _calculateAngles(chars) {
    let angleStart = this._angleStart;

    if (this._isTextReversed) {
      angleStart = -1 * (180 - angleStart);
    }

    const imageAngle = calculateAnglularLength(this._radius, this._imageWidth);

    let gapAngle = calculateAnglularLength(this._radius, this._gap);

    if (this._gap < 0) {
      gapAngle *= -1;
    }

    let extraAngle = 0;

    return chars.map((char, i) => {
      if (i > 0) {
        const pair = `${chars[i - 1]}${char}`;
        const extraGap = this._kerningPairs[pair] || 0;

        if (extraGap) {
          extraAngle += calculateAnglularLength(this._radius, px(extraGap));
        }
      }

      return this._isTextReversed
        ? angleStart - i * imageAngle - i * gapAngle - extraAngle
        : angleStart + i * imageAngle + i * gapAngle + extraAngle;
    });
  }

  _createWidgets() {
    const angles = this._calculateAngles(this._chars);

    return this._chars.map((char, i) =>
      hmUI.createWidget(hmUI.widget.IMG, {
        src: this._charImages[char] || this._charImages[' '],
        w: this._screenSize,
        h: this._screenSize,
        x: 0,
        y: 0,
        pos_x: this._screenSize / 2 - this._imageWidth / 2,
        pos_y: this._isTextReversed
          ? this._screenSize / 2 + this._radius
          : this._screenSize / 2 - this._radius - this._imageHeight,
        center_x: this._screenSize / 2,
        center_y: this._screenSize / 2,
        angle: angles[i],
        show_level: hmUI.show_level.ONLY_NORMAL,
      }),
    );
  }

  updateText(text) {
    const newTextChars = this._normalizeText(text);
    const newAngles = this._calculateAngles(newTextChars);

    for (let i = 0; i < this._chars.length; i++) {
      if (this._chars[i] !== newTextChars[i]) {
        this._widgets[i].setProperty(
          hmUI.prop.SRC,
          this._charImages[newTextChars[i]] || this._charImages[' '],
        );

        this._chars[i] = newTextChars[i];
      }

      this._widgets[i].setProperty(hmUI.prop.MORE, {
        angle: newAngles[i],
      });
    }
  }
}
