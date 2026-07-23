import { getWeekDay } from '../../../adapters/getWeekDay';
import { getTimeTexts } from '../../../adapters/getTimeTexts';
import { getDay } from '../../../adapters/getDay';
import { getMonth } from '../../../adapters/getMonth';
import { formatNumber } from '../../../utils/formatNumber';
import {
  BACKGROUND_GRADIENT_IMAGE_PROPS,
  BATTERY_STATUS_PROPS,
  DAILY_RANDOM_BACKGROUND_ID,
  DATA_TEXT_PROPS,
  DATE_TEXT_PROPS,
  DISCONNECT_STATUS_PROPS,
  EDIT_BACKGROUND_PROPS,
  HOURLY_RANDOM_BACKGROUND_ID,
  RANDOM_BACKGROUND_PROPS,
} from './index.r.layout';
import { TimeTextWidget } from './TimeTextWidget';
import { gettext } from 'i18n';

function getDailySeed(timeSensor) {
  return (
    timeSensor.year * 10000 +
    timeSensor.month * 100 +
    timeSensor.day
  );
}

function getHourlySeed(timeSensor) {
  return (
    timeSensor.year * 1000000 +
    timeSensor.month * 10000 +
    timeSensor.day * 100 +
    timeSensor.hour
  );
}

function mixSeed(seed) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

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

function getRandomBackgroundColor(seed) {
  const value = mixSeed(seed);
  const hue = value % 360;
  const saturation = 60 + ((value >>> 9) % 31);
  const lightness = 35 + ((value >>> 17) % 26);

  return hslToRgb(hue, saturation, lightness);
}

/**
 * Normalise plusieurs formats possibles de CURRENT_CONFIG.
 * Les chemins 7.png et 8.png sont prioritaires car non ambigus.
 */
function getBackgroundId(config) {
  if (!config) {
    return EDIT_BACKGROUND_PROPS.default_id;
  }

  const pathCandidates = [
    config.path,
    config.preview,
    config.src,
    config.image,
  ];

  for (let i = 0; i < pathCandidates.length; i += 1) {
    const path = pathCandidates[i];

    if (typeof path === 'string') {
      if (path.indexOf('backgrounds/8.png') !== -1) {
        return HOURLY_RANDOM_BACKGROUND_ID;
      }

      if (path.indexOf('backgrounds/7.png') !== -1) {
        return DAILY_RANDOM_BACKGROUND_ID;
      }
    }
  }

  const idCandidates = [
    config.id,
    config.value,
    config.current,
    config.selected,
    config.selected_id,
    config.current_id,
  ];

  for (let i = 0; i < idCandidates.length; i += 1) {
    if (typeof idCandidates[i] === 'number') {
      return idCandidates[i];
    }
  }

  if (typeof config === 'number') {
    /*
     * Les valeurs 1 à 8 sont généralement des identifiants.
     * La valeur 0 est traitée comme le premier index.
     */
    return config === 0 ? 1 : config;
  }

  if (typeof config.index === 'number') {
    return config.index + 1;
  }

  return EDIT_BACKGROUND_PROPS.default_id;
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
    /*
     * Un seul rectangle dynamique est créé derrière WATCHFACE_EDIT_BG.
     * Les fonds 1 à 6 le masquent. Les images transparentes 7 et 8
     * le laissent apparaître.
     */
    const randomBackgroundWidget = hmUI.createWidget(
      hmUI.widget.FILL_RECT,
      RANDOM_BACKGROUND_PROPS,
    );

    const editBackgroundWidget = hmUI.createWidget(
      hmUI.widget.WATCHFACE_EDIT_BG,
      EDIT_BACKGROUND_PROPS,
    );

    const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
    let previousSeed = -1;
    let previousMode = -1;

    const updateRandomBackground = () => {
      const selectedConfig = editBackgroundWidget.getProperty(
        hmUI.prop.CURRENT_CONFIG,
      );
      const selectedBackgroundId = getBackgroundId(selectedConfig);

      let currentSeed = -1;

      if (selectedBackgroundId === DAILY_RANDOM_BACKGROUND_ID) {
        currentSeed = getDailySeed(timeSensor);
      } else if (
        selectedBackgroundId === HOURLY_RANDOM_BACKGROUND_ID
      ) {
        currentSeed = getHourlySeed(timeSensor);
      } else {
        return;
      }

      if (
        currentSeed === previousSeed &&
        selectedBackgroundId === previousMode
      ) {
        return;
      }

      previousSeed = currentSeed;
      previousMode = selectedBackgroundId;

      randomBackgroundWidget.setProperty(
        hmUI.prop.COLOR,
        getRandomBackgroundColor(currentSeed),
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
            updateRandomBackground,
          );
          updateRandomBackground();
        }
      },
      pause_call: () => {
        timeSensor.removeEventListener?.(
          timeSensor.event.MINUTEEND,
          updateRandomBackground,
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
