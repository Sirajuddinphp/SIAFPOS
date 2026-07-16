<?php
it('activates a valid restaurant license subscription and device', function(){ $payload=validActivationPayload(); $this->postJson('/api/v1/activation',$payload)->assertCreated()->assertJsonPath('data.tokenType','Bearer')->assertJsonStructure(['data'=>['token','tenantUuid','restaurantUuid','deviceUuid','configuration']]); });
it('rejects invalid license and never creates a device', function(){ $payload=validActivationPayload(); $payload['license_key']='INVALID-KEY-000'; $this->postJson('/api/v1/activation',$payload)->assertUnprocessable(); $this->assertDatabaseCount('devices',0); });
it('enforces terminal limits', function(){ seedActiveDeviceAtLimit(); $this->postJson('/api/v1/activation',validActivationPayload())->assertUnprocessable(); });
it('is rate limited', function(){ for($i=0;$i<6;$i++) $response=$this->postJson('/api/v1/activation',invalidActivationPayload()); $response->assertTooManyRequests(); });
