import { getWeekDay } from '../../../adapters/getWeekDay';
import { getTimeTexts } from '../../../adapters/getTimeTexts';
import { getDay } from '../../../adapters/getDay';
import { getMonth } from '../../../adapters/getMonth';
import { formatNumber } from '../../../utils/formatNumber';
import {
  BACKGROUND_GRADIENT_IMAGE_PROPS,
  BATTERY_STATUS_PROPS,
  DAILY_RANDOM_BACKGROUND_ID,
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
 * La graine est identique pendant toute une journée.
 */
function getDateSeed(timeSensor) {
  return (
    timeSensor.year * 10000 +
    timeSensor.month * 100 +
    timeSensor.day
  );
}

/**
 * Générateur pseudo-aléatoire déterministe 32 bits.
 * Il évite Math.random(), qui pourrait changer à chaque reconstruction
 * de la watchface pendant une même journée.
 */
function mixSeed(seed) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

/**
 * Produit une couleur RGB différente chaque jour.
 * Chaque composante reste comprise entre 48 et 223 afin d'éviter
 * les couleurs presque noires ou presque blanches.
 */
function getDailyBackgroundColor(timeSensor) {
  const value = mixSeed(getDateSeed(timeSensor));

  const red = 48 + ((value >>> 16) & 0xff) % 176;
  const green = 48 + ((value >>> 8) & 0xff) % 176;
  const blue = 48 + (value & 0xff) % 176;

  return (red << 16) | (green << 8) | blue;
}

/**
 * WATCHFACE_EDIT_BG renvoie normalement l'objet sélectionné avec
 * hmUI.prop.CURRENT_CONFIG. Cette fonction accepte plusieurs formes
 * possibles afin de rester tolérante selon la version du firmware.
 */
function getBackgroundId(backgroundConfig) {
  if (typeof backgroundConfig === 'number') {
    return backgroundConfig;
  }

  if (!backgroundConfig) {
    return EDIT_BACKGROUND_PROPS.default_id;
  }

  if (typeof backgroundConfig.id === 'number') {
    return backgroundConfig.id;
  }

  if (
    typeof backgroundConfig.path === 'string' &&
    backgroundConfig.path.indexOf('backgrounds/7.png') !== -1
  ) {
    return DAILY_RANDOM_BACKGROUND_ID;
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
    const editBackgroundWidget = hmUI.createWidget(
      hmUI.widget.WATCHFACE_EDIT_BG,
      EDIT_BACKGROUND_PROPS,
    );

    const selectedConfig = editBackgroundWidget.getProperty(
      hmUI.prop.CURRENT_CONFIG,
    );
    const selectedBackgroundId = getBackgroundId(selectedConfig);

    if (selectedBackgroundId === DAILY_RANDOM_BACKGROUND_ID) {
      const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);

      const randomBackgroundWidget = hmUI.createWidget(
        hmUI.widget.FILL_RECT,
        {
          ...DAILY_RANDOM_BACKGROUND_PROPS,
          color: getDailyBackgroundColor(timeSensor),
        },
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
    }

    /**
     * Le dégradé existant reste au-dessus du fond, comme avant.
     * Il n'est affiché ni en AOD ni sur l'écran éteint.
     */
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
