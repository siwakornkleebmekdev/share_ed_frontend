import { notificationService } from '../services/notification.service';
import * as realtime from '../utils/socket';
import { createNotificationStore } from './notificationCore';

export default createNotificationStore(notificationService, realtime);
