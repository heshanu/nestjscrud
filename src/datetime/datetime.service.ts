/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatetimeService {
    setDateNotification(): string {
        const now: Date = new Date();

        const year: number = now.getFullYear();
        const month: number = now.getMonth() + 1; // Months are zero-based
        const day: number = now.getDate();
        const hours: number = now.getHours();
        const minutes: number = now.getMinutes();
        const seconds: number = now.getSeconds();

        console.log(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
