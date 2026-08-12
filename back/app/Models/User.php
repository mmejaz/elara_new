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
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'avatar', 'phone', 'designation', 'country', 'city', 'bio', 'settings'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasApiTokens, Notifiable, HasRoles, HasFiles;

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
        ];
    }

    /** Organizations this user is assigned to (empty for a Super Admin, who sees all). */
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
