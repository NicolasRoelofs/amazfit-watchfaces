import { getWeekDay } from '../../../adapters/getWeekDay';
import { getTimeTexts } from '../../../adapters/getTimeTexts';
import { getDay } from '../../../adapters/getDay';
import { getMonth } from '../../../adapters/getMonth';
import { formatNumber } from '../../../utils/formatNumber';
import {
  BACKGROUND_GRADIENT_IMAGE_PROPS,
  BATTERY_STATUS_PROPS,
  DAILY_RANDOM_BACKGROUND_PROPS,
  DATA_TEXT_PROPS,
  DATE_TEXT_PROPS,
  DISCONNECT_STATUS_PROPS,
  EDIT_BACKGROUND_PROPS,
} from './index.r.layout';
import { TimeTextWidget } from './TimeTextWidget';
import { gettext } from 'i18n';

/**
 * Transforme la date locale en graine numérique.
 */
function getDateSeed(timeSensor) {
  return (
    timeSensor.year * 10000 +
    timeSensor.month * 100 +
    timeSensor.day
  );
}

/**
 * Mélange déterministe 32 bits.
 */
function mixSeed(seed) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

/**
 * Convertit une couleur HSL en RGB Zepp OS.
 */
function hslToRgb(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (section < 1) {
    red = chroma;
    green = x;
  } else if (section < 2) {
    red = x;
    green = chroma;
  } else if (section < 3) {
    green = chroma;
    blue = x;
  } else if (section < 4) {
    green = x;
    blue = chroma;
  } else if (section < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  const match = l - chroma / 2;

  red = Math.round((red + match) * 255);
  green = Math.round((green + match) * 255);
  blue = Math.round((blue + match) * 255);

  return (red << 16) | (green << 8) | blue;
}

/**
 * Couleur vive quotidienne :
 * - saturation 60 à 90 % ;
 * - luminosité 35 à 60 % ;
 * - noir, blanc et gris exclus.
 */
function getDailyBackgroundColor(timeSensor) {
  const value = mixSeed(getDateSeed(timeSensor));
  const hue = value % 360;
  const saturation = 60 + ((value >>> 9) % 31);
  const lightness = 35 + ((value >>> 17) % 26);

  return hslToRgb(hue, saturation, lightness);
}

WatchFace({
  onInit() {
    console.log('watchface initing');
  },

  build() {
    console.log('watchface building');
    this.buildBackground();
    this.buildTime();
    this.buildSteps();
    this.buildDisconnectStatus();
    this.buildBatteryStatus();
  },

  onDestroy() {
    console.log('watchface destroying');
  },

  buildBackground() {
    const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);

    /*
     * Le rectangle est toujours créé EN PREMIER.
     * Les fonds 1 à 6 le recouvrent.
     * Le fond 7 transparent le laisse apparaître.
     * Cela évite toute dépendance à CURRENT_CONFIG.
     */
    const randomBackgroundWidget = hmUI.createWidget(
      hmUI.widget.FILL_RECT,
      {
        ...DAILY_RANDOM_BACKGROUND_PROPS,
        color: getDailyBackgroundColor(timeSensor),
      },
    );

    hmUI.createWidget(
      hmUI.widget.WATCHFACE_EDIT_BG,
      EDIT_BACKGROUND_PROPS,
    );

    let previousDateSeed = -1;

    const updateDailyBackground = () => {
      const currentDateSeed = getDateSeed(timeSensor);

      if (currentDateSeed === previousDateSeed) {
        return;
      }

      previousDateSeed = currentDateSeed;

      randomBackgroundWidget.setProperty(
        hmUI.prop.COLOR,
        getDailyBackgroundColor(timeSensor),
      );
    };

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        const screenType = hmSetting.getScreenType();

        if (
          screenType === hmSetting.screen_type.WATCHFACE ||
          screenType === hmSetting.screen_type.SETTINGS
        ) {
          timeSensor.addEventListener?.(
            timeSensor.event.MINUTEEND,
            updateDailyBackground,
          );
          updateDailyBackground();
        }
      },
      pause_call: () => {
        timeSensor.removeEventListener?.(
          timeSensor.event.MINUTEEND,
          updateDailyBackground,
        );
      },
    });

    hmUI.createWidget(
      hmUI.widget.IMG,
      BACKGROUND_GRADIENT_IMAGE_PROPS,
    );
  },

  buildTime() {
    const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
    const textWidget = new TimeTextWidget();
    const dateTextWidget = hmUI.createWidget(
      hmUI.widget.TEXT,
      DATE_TEXT_PROPS,
    );

    let prevDay = -1;
    let prevTime = '';

    const update = () => {
      const { hourText, minuteText } = getTimeTexts(timeSensor);
      const timeText = `${hourText}:${minuteText}`;

      if (prevTime === timeText) {
        return;
      }

      prevTime = timeText;
      textWidget.set(timeText);

      const day = getDay(timeSensor);

      if (prevDay === day) {
        return;
      }

      prevDay = day;

      const monthKey = getMonth(timeSensor);
      const dayText = gettext(monthKey).replace(
        '{day}',
        day.toString(),
      );

      const weekdayKey = getWeekDay(timeSensor);
      const weekDay = gettext(weekdayKey);
      const dateText = weekDay + ',' + '\n' + dayText;

      dateTextWidget.setProperty(
        hmUI.prop.TEXT,
        dateText,
      );
    };

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        if (
          hmSetting.getScreenType() ===
            hmSetting.screen_type.WATCHFACE ||
          hmSetting.getScreenType() ===
            hmSetting.screen_type.AOD ||
          hmSetting.getScreenType() ===
            hmSetting.screen_type.SETTINGS
        ) {
          timeSensor.addEventListener?.(
            timeSensor.event.MINUTEEND,
            update,
          );
          update();
        }
      },
      pause_call: () => {
        timeSensor.removeEventListener?.(
          timeSensor.event.MINUTEEND,
          update,
        );
      },
    });
  },

  buildSteps() {
    const stepSensor = hmSensor.createSensor(hmSensor.id.STEP);
    const textWidget = hmUI.createWidget(
      hmUI.widget.TEXT,
      DATA_TEXT_PROPS,
    );

    let prevValue = 0;

    const update = () => {
      const { current = 0, target = 10000 } = stepSensor;

      if (prevValue === current) {
        return;
      }

      prevValue = current;

      const text = `${formatNumber(current, ' ')} ${gettext(
        'steps',
      )} ${current >= target ? '✓' : ''}`.trim();

      textWidget.setProperty(
        hmUI.prop.TEXT,
        text,
      );
    };

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        if (
          hmSetting.getScreenType() ===
          hmSetting.screen_type.WATCHFACE
        ) {
          stepSensor?.addEventListener?.(
            hmSensor.event.CHANGE,
            update,
          );
          update();
        }
      },
      pause_call: () => {
        stepSensor?.removeEventListener?.(
          hmSensor.event.CHANGE,
          update,
        );
      },
    });
  },

  buildDisconnectStatus() {
    hmUI.createWidget(
      hmUI.widget.IMG_STATUS,
      DISCONNECT_STATUS_PROPS,
    );
  },

  buildBatteryStatus() {
    const MIN_VALUE = 20;
    const batterySensor = hmSensor.createSensor(
      hmSensor.id.BATTERY,
    );

    const imageWidget = hmUI.createWidget(
      hmUI.widget.IMG,
      BATTERY_STATUS_PROPS,
    );

    const update = () => {
      const { current = 0 } = batterySensor;

      imageWidget.setProperty(
        hmUI.prop.VISIBLE,
        current < MIN_VALUE,
      );
    };

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        if (
          hmSetting.getScreenType() ===
          hmSetting.screen_type.WATCHFACE
        ) {
          update();
        }
      },
    });
  },
});
