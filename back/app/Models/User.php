<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\HasFiles;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Lab404\Impersonate\Models\Impersonate;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'avatar', 'phone', 'designation', 'country', 'city', 'bio', 'settings'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasApiTokens, Notifiable, HasRoles, HasFiles, Impersonate;

    /** Account status values. Anything other than ACTIVE blocks login. */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_DEACTIVATED = 'deactivated';
    public const STATUS_BLOCKED = 'blocked';

    /** True when the account may sign in. */
    public function isActive(): bool
    {
        return ($this->status ?? self::STATUS_ACTIVE) === self::STATUS_ACTIVE;
    }

    /** Only a Super Admin may impersonate — the package checks this in take(). */
    public function canImpersonate(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /** A Super Admin can't be impersonated (no impersonating an equal). */
    public function canBeImpersonated(): bool
    {
        return ! $this->hasRole('Super Admin');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'settings' => 'array',
            'status_changed_at' => 'datetime',
        ];
    }

    /**
     * Organizations this user belongs to. Every user is assigned at least one
     * (the tenant owner included). A Super Admin still SEES all organizations
     * regardless of assignment — see seesAllOrganizations().
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class);
    }

    /**
     * Super Admins see every organization in the tenant; everyone else is
     * limited to the organizations they are explicitly assigned to.
     */
    public function seesAllOrganizations(): bool
    {
        return $this->hasRole('Super Admin');
    }

    protected static function booted(): void
    {
        // Spatie's model_has_roles / model_has_permissions pivots key the model
        // side by (model_id, model_type) with NO foreign key, so a hard delete
        // would orphan them — and a future user reusing the same id could inherit
        // the stale roles. Detach explicitly on delete.
        static::deleting(function (User $user): void {
            $user->roles()->detach();
            $user->permissions()->detach();
        });
    }
}
