<?php
namespace App\Services;
use App\Models\{ActivationAttempt,Device,LicenseModel,Restaurant,Subscription}; use Illuminate\Support\Facades\{DB,Hash}; use Illuminate\Validation\ValidationException;
final class ActivationService { public function activate(array $data,string $ip): array { return DB::transaction(function() use($data,$ip){
$restaurant=Restaurant::query()->where('code',strtoupper($data['restaurant_code']))->lockForUpdate()->first();
if(!$restaurant || $restaurant->status!=='active' || strcasecmp($restaurant->owner_email,$data['owner_email'])!==0 || $restaurant->owner_mobile!==$data['owner_mobile']) $this->fail('RESTAURANT_VALIDATION_FAILED','Restaurant or owner details are invalid.');
$license=LicenseModel::query()->where('restaurant_id',$restaurant->id)->where('key_hash',hash('sha256',strtoupper($data['license_key'])))->lockForUpdate()->first();
if(!$license || $license->status!=='active' || $license->starts_at->isFuture() || ($license->expires_at && $license->expires_at->isPast())) $this->fail('LICENSE_INVALID','License is invalid, inactive, or expired.');
$subscription=Subscription::query()->where('restaurant_id',$restaurant->id)->latest('ends_at')->first();
if(!$subscription || !in_array($subscription->status,['active'],true) || now()->greaterThan($subscription->grace_ends_at ?? $subscription->ends_at)) $this->fail('SUBSCRIPTION_INACTIVE','Subscription is not active.');
$activeCount=Device::query()->where('license_id',$license->id)->where('status','active')->count();
$existing=Device::query()->where('restaurant_id',$restaurant->id)->where(fn($q)=>$q->where('client_device_uuid',$data['device']['uuid'])->orWhere('machine_fingerprint',$data['device']['machine_fingerprint']))->first();
if(!$existing && $activeCount >= $license->plan->terminal_limit) $this->fail('TERMINAL_LIMIT_REACHED','License terminal limit has been reached.');
$device=Device::updateOrCreate(['restaurant_id'=>$restaurant->id,'client_device_uuid'=>$data['device']['uuid']],['uuid'=>$existing?->uuid ?? (string)str()->uuid(),'tenant_id'=>$restaurant->tenant_id,'license_id'=>$license->id,'machine_fingerprint'=>$data['device']['machine_fingerprint'],'windows_username'=>$data['device']['windows_username']??null,'computer_name'=>$data['device']['computer_name']??null,'app_version'=>$data['device']['app_version'],'status'=>'active','activated_at'=>$existing?->activated_at ?? now(),'last_seen_at'=>now()]);
if(in_array($device->status,['revoked','blocked'],true)) $this->fail('DEVICE_NOT_ALLOWED','This device is revoked or blocked.');
$token=auth('api')->claims(['tenant_uuid'=>$restaurant->tenant->uuid,'restaurant_uuid'=>$restaurant->uuid,'device_uuid'=>$device->uuid,'license_uuid'=>$license->uuid])->login($device);
ActivationAttempt::create(['uuid'=>(string)str()->uuid(),'restaurant_code'=>$restaurant->code,'owner_email'=>$restaurant->owner_email,'ip_address'=>$ip,'machine_fingerprint'=>$device->machine_fingerprint,'successful'=>true]);
return compact('restaurant','license','subscription','device','token'); }); }
private function fail(string $code,string $message): never { throw ValidationException::withMessages(['activation'=>[$message]])->status(422); }
}
