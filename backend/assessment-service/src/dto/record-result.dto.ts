import { IsBoolean, IsUUID } from 'class-validator';

export class RecordResultDto {
  @IsUUID()
  problemId: string;

  @IsBoolean()
  passed: boolean;
}
